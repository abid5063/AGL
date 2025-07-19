import express from "express";
import jwt from "jsonwebtoken";
import { Appointment } from "../models/Appointment.js";
import Farmer from "../models/Farmer.js";
import { Vet } from "../models/Vet.js";
import Animal from "../models/Animal.js";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create new appointment (Farmer)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.status(403).json({ message: "Only farmers can create appointments" });
    }

    const {
      vetId,
      animalId,
      appointmentType,
      priority,
      scheduledDate,
      scheduledTime,
      duration,
      symptoms,
      description,
      location,
      images
    } = req.body;

    // Validation
    if (!vetId || !animalId || !scheduledDate || !scheduledTime || !symptoms) {
      return res.status(400).json({ 
        message: "Vet ID, Animal ID, scheduled date, time, and symptoms are required" 
      });
    }

    // Verify vet exists and is verified
    const vet = await Vet.findById(vetId);
    if (!vet || !vet.isVerified || !vet.isActive) {
      return res.status(400).json({ message: "Vet not found or not available" });
    }

    // Verify animal belongs to the farmer
    const animal = await Animal.findOne({ _id: animalId, farmerId: req.user.farmerId });
    if (!animal) {
      return res.status(400).json({ message: "Animal not found or doesn't belong to you" });
    }

    // Check for overlapping appointments
    const overlappingAppointments = await Appointment.findOverlapping(
      vetId, 
      scheduledDate, 
      scheduledTime, 
      duration || 30
    );

    if (overlappingAppointments.length > 0) {
      return res.status(400).json({ 
        message: "Vet is not available at the selected time. Please choose a different time slot." 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      farmerId: req.user.farmerId,
      vetId,
      animalId,
      appointmentType: appointmentType || 'consultation',
      priority: priority || 'normal',
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration: duration || 30,
      symptoms: symptoms.trim(),
      description: description?.trim(),
      location: location || { type: 'clinic' },
      images: images || [],
      fee: {
        consultationFee: vet.consultationFee || 0,
        travelFee: location?.type === 'farm' ? (vet.travelFee || 0) : 0
      }
    });

    await appointment.save();

    // Populate related data for response
    await appointment.populate([
      { path: 'vetId', select: 'name specialty phoneNo location' },
      { path: 'animalId', select: 'name species breed' },
      { path: 'farmerId', select: 'name email phoneNo' }
    ]);

    res.status(201).json({
      message: "Appointment created successfully",
      appointment
    });

  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get farmer's appointments
router.get("/farmer", verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { farmerId: req.user.farmerId };
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('vetId', 'name specialty phoneNo location rating')
      .populate('animalId', 'name species breed')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error("Get farmer appointments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get vet's appointments
router.get("/vet", verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'vet') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status, date, page = 1, limit = 10 } = req.query;
    const query = { vetId: req.user.vetId };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('farmerId', 'name email phoneNo location')
      .populate('animalId', 'name species breed age weight')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    // Add additional data for vet dashboard
    const appointmentData = appointments.map(appointment => ({
      ...appointment.toObject(),
      farmerName: appointment.farmerId.name,
      animalType: appointment.animalId.species,
      animalName: appointment.animalId.name,
      date: appointment.scheduledDate,
      id: appointment._id
    }));

    res.json({
      appointments: appointmentData,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error("Get vet appointments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single appointment
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('farmerId', 'name email phoneNo location')
      .populate('vetId', 'name specialty phoneNo location rating')
      .populate('animalId', 'name species breed age weight');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      (req.user.userType === 'farmer' && appointment.farmerId._id.toString() === req.user.farmerId) ||
      (req.user.userType === 'vet' && appointment.vetId._id.toString() === req.user.vetId);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(appointment);

  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update appointment status (Vet)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'vet') {
      return res.status(403).json({ message: "Only vets can update appointment status" });
    }

    const { status, diagnosis, treatment, prescription, vetNotes, followUpRequired, followUpDate } = req.body;
    
    const appointment = await Appointment.findOne({ 
      _id: req.params.id, 
      vetId: req.user.vetId 
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update fields
    if (status) appointment.status = status;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (treatment) appointment.treatment = treatment;
    if (prescription) appointment.prescription = prescription;
    if (vetNotes) appointment.vetNotes = vetNotes;
    if (followUpRequired !== undefined) appointment.followUpRequired = followUpRequired;
    if (followUpDate) appointment.followUpDate = new Date(followUpDate);

    await appointment.save();

    // Update vet's appointment statistics
    if (status === 'completed') {
      await Vet.findByIdAndUpdate(req.user.vetId, {
        $inc: { completedAppointments: 1 }
      });
    } else if (status === 'cancelled') {
      await Vet.findByIdAndUpdate(req.user.vetId, {
        $inc: { cancelledAppointments: 1 }
      });
    }

    res.json({
      message: "Appointment updated successfully",
      appointment
    });

  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Cancel appointment
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has permission to cancel
    const hasPermission = 
      (req.user.userType === 'farmer' && appointment.farmerId.toString() === req.user.farmerId) ||
      (req.user.userType === 'vet' && appointment.vetId.toString() === req.user.vetId);

    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        message: "Appointment cannot be cancelled (too close to appointment time or already completed)" 
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user.userType;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Update statistics
    if (req.user.userType === 'vet') {
      await Vet.findByIdAndUpdate(req.user.vetId, {
        $inc: { cancelledAppointments: 1 }
      });
    }

    res.json({
      message: "Appointment cancelled successfully",
      appointment
    });

  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get available time slots for a vet on a specific date
router.get("/availability/:vetId/:date", verifyToken, async (req, res) => {
  try {
    const { vetId, date } = req.params;
    
    const vet = await Vet.findById(vetId);
    if (!vet || !vet.isActive || !vet.isVerified) {
      return res.status(404).json({ message: "Vet not found or not available" });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    const daySchedule = vet.availableHours[dayName];
    if (!daySchedule || !daySchedule.available) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for the day
    const existingAppointments = await Appointment.getVetSchedule(vetId, selectedDate);
    const bookedSlots = existingAppointments
      .filter(apt => ['pending', 'accepted', 'in-progress'].includes(apt.status))
      .map(apt => apt.scheduledTime);

    // Generate available time slots (assuming 30-minute slots)
    const startHour = daySchedule.start ? parseInt(daySchedule.start.split(':')[0]) : 9;
    const endHour = daySchedule.end ? parseInt(daySchedule.end.split(':')[0]) : 17;
    
    const availableSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedSlots.includes(timeSlot)) {
          availableSlots.push(timeSlot);
        }
      }
    }

    res.json({ availableSlots });

  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
