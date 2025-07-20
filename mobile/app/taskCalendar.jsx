import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(response.data);
      updateMarkedDates(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateMarkedDates = (taskList) => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];
    
    taskList.forEach(task => {
      const dateStr = new Date(task.dueDate).toISOString().split('T')[0];
      const isOverdue = dateStr < today && !task.isCompleted;
      
      if (!marked[dateStr]) {
        marked[dateStr] = {
          dots: [],
          selected: false,
          selectedColor: '#007AFF'
        };
      }
      
      // Add color-coded dots based on task status and priority
      let dotColor = '#007AFF';
      if (task.isCompleted) {
        dotColor = '#2ecc71';
      } else if (isOverdue) {
        dotColor = '#e74c3c';
      } else if (task.priority === 'high') {
        dotColor = '#ff4444';
      } else if (task.priority === 'medium') {
        dotColor = '#ffaa00';
      } else {
        dotColor = '#44ff44';
      }
      
      marked[dateStr].dots.push({
        color: dotColor,
        selectedDotColor: '#fff'
      });
    });
    
    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // Update marked dates to show selection
    const newMarked = { ...markedDates };
    Object.keys(newMarked).forEach(key => {
      newMarked[key].selected = key === dateStr;
    });
    setMarkedDates(newMarked);
    
    // Filter tasks for selected date
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
    
    setSelectedDateTasks(dayTasks);
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff44';
      default: return '#666';
    }
  };

  // Check if task is overdue
  const isOverdue = (dueDate, isCompleted) => {
    if (isCompleted) return false;
    const now = new Date();
    const taskDate = new Date(dueDate);
    return taskDate < now;
  };

  // Refresh tasks when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  // Render task item
  const renderTask = ({ item }) => (
    <View style={[
      styles.taskItem,
      item.isCompleted && styles.completedTask,
      isOverdue(item.dueDate, item.isCompleted) && styles.overdueTask
    ]}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          onPress={() => toggleTaskCompletion(item._id)}
          style={[
            styles.checkbox,
            item.isCompleted && styles.checkedCheckbox
          ]}
        >
          {item.isCompleted && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </TouchableOpacity>
        
        <View style={styles.taskInfo}>
          <Text style={[
            styles.taskTitle,
            item.isCompleted && styles.completedText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.taskTime}>
            {item.dueTime}
          </Text>
        </View>
        
        <View style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(item.priority) }
        ]}>
          <Text style={styles.priorityText}>
            {item.priority.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.taskDescription}>{item.description}</Text>
      )}
      
      <View style={styles.taskFooter}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/editTask?id=${item._id}`)}
        >
          <Ionicons name="pencil" size={14} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {item.animal && (
          <View style={styles.animalTag}>
            <Ionicons name="paw" size={12} color="#666" />
            <Text style={styles.animalText}>{item.animal.name}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Task Calendar</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/addTask')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#007AFF',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#2d4150',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        monthFormat="MMMM yyyy"
        hideExtraDays={true}
        firstDay={1}
        enableSwipeMonths={true}
      />

      {selectedDate && (
        <View style={styles.tasksContainer}>
          <Text style={styles.selectedDateText}>
            {formatDate(selectedDate)}
          </Text>
          
          <FlatList
            data={selectedDateTasks}
            renderItem={renderTask}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.tasksList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchTasks();
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No tasks for this date</Text>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => router.push('/addTask')}
                >
                  <Text style={styles.addTaskText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      )}

      {!selectedDate && (
        <View style={styles.instructionsContainer}>
          <Ionicons name="calendar" size={64} color="#ccc" />
          <Text style={styles.instructionsText}>
            Select a date to view tasks
          </Text>
          <Text style={styles.instructionsSubText}>
            Tap on any date to see scheduled tasks for that day
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tasksContainer: {
    flex: 1,
    padding: 20,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tasksList: {
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 12,
    marginLeft: 4,
  },
  animalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  animalText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  addTaskButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  addTaskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  instructionsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  instructionsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
