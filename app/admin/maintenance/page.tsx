'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, Settings, Zap, Database, Server, HardDrive, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Clock, Activity, Trash2, Archive,
  Download, Upload, RotateCcw, Shield, Key, Users, FileText, BarChart,
  Play, Pause, Eye, Edit, Plus, Search, Filter
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'database' | 'cache' | 'storage' | 'security' | 'performance' | 'backup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // minutes
  lastRun?: Date;
  nextRun?: Date;
  progress: number;
  autoRun: boolean;
  schedule?: string; // cron expression
}

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    maxConnections: number;
    queryTime: number;
    lastBackup: Date;
  };
  cache: {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    memoryUsage: number;
    maxMemory: number;
    lastClear: Date;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    used: number;
    total: number;
    free: number;
    lastCleanup: Date;
  };
  performance: {
    status: 'healthy' | 'warning' | 'critical';
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    lastOptimization: Date;
  };
}

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: {
      status: 'healthy',
      connections: 12,
      maxConnections: 100,
      queryTime: 45,
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    cache: {
      status: 'warning',
      hitRate: 78,
      memoryUsage: 85,
      maxMemory: 100,
      lastClear: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    storage: {
      status: 'healthy',
      used: 65,
      total: 100,
      free: 35,
      lastCleanup: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    performance: {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 62,
      responseTime: 120,
      lastOptimization: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  });
  const [loading, setLoading] = useState(true);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    type: 'database' as 'database' | 'cache' | 'storage' | 'security' | 'performance' | 'backup',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    estimatedDuration: 30,
    autoRun: false,
    schedule: ''
  });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      const [tasksRes, statusRes] = await Promise.all([
        fetch('/api/admin/maintenance/tasks'),
        fetch('/api/admin/maintenance/status')
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData.status || systemStatus);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTask = async (taskId: string) => {
    setRunningTask(taskId);
    try {
      const res = await fetch(`/api/admin/maintenance/tasks/${taskId}/run`, {
        method: 'POST'
      });
      
      if (res.ok) {
        fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Error running task:', error);
    } finally {
      setRunningTask(null);
    }
  };

  const createTask = async () => {
    try {
      const res = await fetch('/api/admin/maintenance/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({
          name: '',
          description: '',
          type: 'database',
          priority: 'medium',
          estimatedDuration: 30,
          autoRun: false,
          schedule: ''
        });
        fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this maintenance task?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/maintenance/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-200';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-200';
      case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-200';
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database size={20} className="text-blue-600" />;
      case 'cache': return <RefreshCw size={20} className="text-green-600" />;
      case 'storage': return <HardDrive size={20} className="text-purple-600" />;
      case 'security': return <Shield size={20} className="text-red-600" />;
      case 'performance': return <BarChart size={20} className="text-orange-600" />;
      case 'backup': return <Archive size={20} className="text-indigo-600" />;
      default: return <Settings size={20} className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={20} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-600" />;
      case 'critical': return <XCircle size={20} className="text-red-600" />;
      case 'completed': return <CheckCircle size={20} className="text-green-600" />;
      case 'running': return <RefreshCw size={20} className="text-blue-600 animate-spin" />;
      case 'failed': return <XCircle size={20} className="text-red-600" />;
      case 'pending': return <Clock size={20} className="text-gray-600" />;
      default: return <Activity size={20} className="text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          System Maintenance
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTaskModal(true)}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Task
          </button>
          <button
            onClick={fetchMaintenanceData}
            disabled={loading}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Database</h3>
            <Database size={24} className="text-blue-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getStatusColor(systemStatus.database.status).split(' ')[0]}`}>
            {systemStatus.database.status.toUpperCase()}
          </div>
          <div className="text-sm text-mediumGray dark:text-gray-400">
            {systemStatus.database.connections}/{systemStatus.database.maxConnections} connections
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
            Avg query: {systemStatus.database.queryTime}ms
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Cache</h3>
            <RefreshCw size={24} className="text-green-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getStatusColor(systemStatus.cache.status).split(' ')[0]}`}>
            {systemStatus.cache.status.toUpperCase()}
          </div>
          <div className="text-sm text-mediumGray dark:text-gray-400">
            {systemStatus.cache.hitRate}% hit rate
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
            {systemStatus.cache.memoryUsage}% memory used
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Storage</h3>
            <HardDrive size={24} className="text-purple-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getStatusColor(systemStatus.storage.status).split(' ')[0]}`}>
            {systemStatus.storage.status.toUpperCase()}
          </div>
          <div className="text-sm text-mediumGray dark:text-gray-400">
            {systemStatus.storage.used}% used
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
            {systemStatus.storage.free}% free space
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Performance</h3>
            <BarChart size={24} className="text-orange-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getStatusColor(systemStatus.performance.status).split(' ')[0]}`}>
            {systemStatus.performance.status.toUpperCase()}
          </div>
          <div className="text-sm text-mediumGray dark:text-gray-400">
            {systemStatus.performance.cpuUsage}% CPU
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
            {systemStatus.performance.responseTime}ms response
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => runTask('clear-cache')}
            className="p-4 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 flex items-center justify-center"
          >
            <RefreshCw size={20} className="mr-2" />
            Clear Cache
          </button>
          <button
            onClick={() => runTask('optimize-db')}
            className="p-4 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center"
          >
            <Database size={20} className="mr-2" />
            Optimize DB
          </button>
          <button
            onClick={() => runTask('cleanup-storage')}
            className="p-4 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors duration-200 flex items-center justify-center"
          >
            <Trash2 size={20} className="mr-2" />
            Cleanup Storage
          </button>
          <button
            onClick={() => runTask('security-scan')}
            className="p-4 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
          >
            <Shield size={20} className="mr-2" />
            Security Scan
          </button>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
            Maintenance Tasks ({tasks.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading maintenance tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center">
            <Settings size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">No Tasks Found</h4>
            <p className="text-mediumGray dark:text-gray-400">Create your first maintenance task to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                          {task.name}
                        </div>
                        <div className="text-sm text-mediumGray dark:text-gray-400">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(task.type)}
                        <span className="ml-2 text-sm text-darkGray dark:text-gray-100 capitalize">
                          {task.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                      {task.estimatedDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                      {task.lastRun ? new Date(task.lastRun).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => runTask(task.id)}
                          disabled={task.status === 'running' || runningTask === task.id}
                          className="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          title="Run Task"
                        >
                          {runningTask === task.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Edit Task"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-lightGray dark:border-gray-700">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
                {selectedTask ? 'Edit Task' : 'Create New Task'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={selectedTask?.name || newTask.name}
                  onChange={(e) => selectedTask ? 
                    setSelectedTask({ ...selectedTask, name: e.target.value }) :
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter task name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedTask?.description || newTask.description}
                  onChange={(e) => selectedTask ? 
                    setSelectedTask({ ...selectedTask, description: e.target.value }) :
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedTask?.type || newTask.type}
                    onChange={(e) => selectedTask ? 
                      setSelectedTask({ ...selectedTask, type: e.target.value as any }) :
                      setNewTask({ ...newTask, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="database">Database</option>
                    <option value="cache">Cache</option>
                    <option value="storage">Storage</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="backup">Backup</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Priority
                  </label>
                  <select
                    value={selectedTask?.priority || newTask.priority}
                    onChange={(e) => selectedTask ? 
                      setSelectedTask({ ...selectedTask, priority: e.target.value as any }) :
                      setNewTask({ ...newTask, priority: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={selectedTask?.estimatedDuration || newTask.estimatedDuration}
                  onChange={(e) => selectedTask ? 
                    setSelectedTask({ ...selectedTask, estimatedDuration: parseInt(e.target.value) }) :
                    setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTask?.autoRun || newTask.autoRun}
                    onChange={(e) => selectedTask ? 
                      setSelectedTask({ ...selectedTask, autoRun: e.target.checked }) :
                      setNewTask({ ...newTask, autoRun: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-darkGray dark:text-gray-100">Auto Run</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-lightGray dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedTask ? () => {/* Handle edit */} : createTask}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Settings size={16} className="mr-2" />
                {selectedTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
