import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Spinner } from '../components/common/Spinner';
import { Shield, UserCheck, UserX, User, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers();
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeactivate = async (userId, currentActive) => {
    try {
      const res = await adminService.deactivateUser(userId);
      toast.success(res.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Subheader & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
              <Shield className="w-3 h-3 text-amber-700" />
              <span>Admin Console</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Registered Users & Role Management
          </h1>
          <p className="text-xs text-slate-500">
            Monitor registered platform members and deactivate compromised accounts.
          </p>
        </div>

        {/* Tab links between Bookings and Users */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start">
          <Link
            to="/admin/bookings"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            All Bookings
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs"
          >
            Manage Users ({users.length})
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-2">Loading user accounts...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {u._id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-stone-100 text-blue-800 border border-[#254546]/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleDeactivate(u._id, u.isActive)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            u.isActive
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No registered users found.
          </div>
        )}
      </div>
    </div>
  );
};
