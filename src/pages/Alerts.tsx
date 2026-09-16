import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Package, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../utils/api';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        setAlerts(res);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const markAsRead = async (alertId: string) => {
    // Note: Backend doesn't have an update alert endpoint yet, so we just do it locally for now
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'LOW_STOCK':
        return <Package className="text-yellow-500" size={20} />;
      case 'OVERSTOCK':
        return <Package className="text-blue-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-500" size={20} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return 'border-red-200 bg-red-50';
      case 'LOW_STOCK':
        return 'border-yellow-200 bg-yellow-50';
      case 'OVERSTOCK':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const readAlerts = alerts.filter(alert => alert.isRead);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-awwwards-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadAlerts.length} unread alerts • {alerts.length} total alerts
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <CheckCircle size={20} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.type === 'OUT_OF_STOCK').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.type === 'LOW_STOCK').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{unreadAlerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Unread Alerts</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {unreadAlerts.map((alert) => {
              const product = alert.product;
              return (
                <div
                  key={alert.id}
                  className={`p-6 border-l-4 ${getAlertColor(alert.type)} hover:bg-opacity-75 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {alert.message}
                        </h3>
                        {product && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p><span className="font-medium">Product:</span> {product.name}</p>
                            <p><span className="font-medium">SKU:</span> {product.sku}</p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {format(new Date(alert.createdAt), 'MMM dd, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Mark as Read
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Alerts</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your inventory is looking good! No alerts at this time.
              </p>
            </div>
          ) : (
            alerts
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((alert) => {
                const product = alert.product;
                return (
                  <div
                    key={alert.id}
                    className={`p-6 ${alert.isRead ? 'opacity-60' : ''} hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {alert.message}
                          </h3>
                          {alert.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Read
                            </span>
                          )}
                        </div>
                        {product && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p><span className="font-medium">Product:</span> {product.name}</p>
                            <p><span className="font-medium">SKU:</span> {product.sku}</p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {format(new Date(alert.createdAt), 'MMM dd, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;