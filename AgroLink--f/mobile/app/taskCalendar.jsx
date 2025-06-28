import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, Alert, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TaskCalendar() {
  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const router = useRouter();

  useEffect(() => {
    loadTasks();
    registerForPushNotificationsAsync();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('calendarTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        updateMarkedDates(parsedTasks);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load tasks.");
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem('calendarTasks', JSON.stringify(newTasks));
      setTasks(newTasks);
      updateMarkedDates(newTasks);
    } catch (e) {
      Alert.alert("Error", "Failed to save task.");
    }
  };

  const updateMarkedDates = (currentTasks) => {
    const newMarkedDates = {};
    Object.keys(currentTasks).forEach(date => {
      if (currentTasks[date].length > 0) {
        newMarkedDates[date] = { marked: true, dotColor: '#50cebb', activeOpacity: 0 };
      }
    });
    setMarkedDates(newMarkedDates);
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleAddTask = async () => {
    if (!taskText.trim()) return;

    const newTask = { id: Date.now().toString(), text: taskText, completed: false };
    const newTasks = { ...tasks };
    if (!newTasks[selectedDate]) {
      newTasks[selectedDate] = [];
    }
    newTasks[selectedDate].push(newTask);

    await saveTasks(newTasks);
    await scheduleNotificationForTask(selectedDate, taskText);

    setTaskText('');
    setModalVisible(false);
  };
  
  const toggleTaskCompleted = (date, taskId) => {
    const newTasks = { ...tasks };
    const taskIndex = newTasks[date].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      newTasks[date][taskIndex].completed = !newTasks[date][taskIndex].completed;
      saveTasks(newTasks);
    }
  };

  const deleteTask = (date, taskId) => {
    const newTasks = { ...tasks };
    newTasks[date] = newTasks[date].filter(t => t.id !== taskId);
    if (newTasks[date].length === 0) {
      delete newTasks[date];
    }
    saveTasks(newTasks);
  };

  async function scheduleNotificationForTask(date, text) {
    const trigger = new Date(date);
    trigger.setHours(9, 0, 0); // 9:00 AM notification

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder!",
        body: text,
      },
      trigger,
    });
  }

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to receive task reminders.');
        return;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  }

  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4a89dc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Calendar</Text>
      </View>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          arrowColor: 'orange',
          monthTextColor: 'blue',
          indicatorColor: 'blue',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
            <FlatList
              data={tasks[selectedDate] || []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <TouchableOpacity onPress={() => toggleTaskCompleted(selectedDate, item.id)}>
                      <Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={24} color={item.completed ? 'green' : 'gray'} />
                  </TouchableOpacity>
                  <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>{item.text}</Text>
                   <TouchableOpacity onPress={() => deleteTask(selectedDate, item.id)}>
                      <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noTasksText}>No tasks for this day.</Text>}
            />
            <TextInput
              style={styles.input}
              placeholder="Add new task..."
              value={taskText}
              onChangeText={setTaskText}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#00adf5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
   closeButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  noTasksText: {
      textAlign: 'center',
      color: 'gray',
      marginVertical: 20,
  }
}); 