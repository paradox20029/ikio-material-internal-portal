import React, { useState } from 'react';
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Check, 
  Shield, 
  X, 
  Edit3, 
  Briefcase, 
  Clock, 
  Key, 
  Cpu
} from 'lucide-react';
import { User, RoleType, ProductionLine, ShiftType } from '../types';
import { StorageService } from '../services/storage';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const AVAILABLE_LINES: ProductionLine[] = ['SMT', 'MI', 'MI-Finishing', 'FA-Lum', 'FA-Ref'];
const AVATAR_COLORS = ['bg-indigo-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-violet-600', 'bg-teal-600'];

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // New staff form state
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<RoleType>('Data Entry Staff');
  const [shift, setShift] = useState<ShiftType>('Shift 1');
  const [phone, setPhone] = useState<string>('');
  const [assignedLines, setAssignedLines] = useState<ProductionLine[]>(['SMT']);
  const [isAllLines, setIsAllLines] = useState<boolean>(false);

  // Edit staff state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setUsers(StorageService.getUsers());
  };

  const handleLineToggle = (line: ProductionLine) => {
    if (assignedLines.includes(line)) {
      setAssignedLines(assignedLines.filter(l => l !== line));
    } else {
      setAssignedLines([...assignedLines, line]);
    }
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) {
      alert('Please fill in Name and Employee ID.');
      return;
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    StorageService.saveUser({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      email: email.trim() || `${employeeId.toLowerCase()}@ikioems.com`,
      role,
      assignedLines: isAllLines || role === 'Administrator' || role === 'Store Manager' ? 'ALL' : assignedLines,
      shift,
      phone: phone.trim() || undefined,
      status: 'Active',
      avatarColor: randomColor
    });

    // Reset
    setName('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setShowAddForm(false);
    refreshList();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (confirm('Are you sure you want to remove this staff profile?')) {
      StorageService.deleteUser(userId);
      refreshList();
    }
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    StorageService.updateUser({ ...user, status: nextStatus });
    refreshList();
  };

  const handleUpdateUserRole = (user: User, newRole: RoleType) => {
    StorageService.updateUser({ ...user, role: newRole });
    refreshList();
    setEditingUserId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                IKIO Staff & Access Control Directory
              </h2>
              <p className="text-xs text-slate-400">
                Administrator panel: Add data entry staff, assign production lines, and set roles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Staff Button / Action */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total Staff Registered: <strong className="text-white font-mono">{users.length}</strong>
          </div>

          <button
            id="btn-toggle-add-staff-form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add New Staff Member'}</span>
          </button>
        </div>

        {/* Add New Staff Member Form */}
        {showAddForm && (
          <form onSubmit={handleCreateStaff} className="bg-slate-800/90 border border-indigo-500/40 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Create Staff Profile & Assign Roles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Employee ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. IKIO-OP-205"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@ikioems.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assigned System Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Data Entry Staff">Data Entry Staff (Floor Operator)</option>
                  <option value="Production Supervisor">Production Supervisor</option>
                  <option value="Administrator">Administrator (Plant Head)</option>
                  <option value="Store Manager">Store & Inventory Manager</option>
                  <option value="Quality Inspector">Quality Inspector</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Primary Shift
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Shift 1">Shift 1 (06:00 - 14:00)</option>
                  <option value="Shift 2">Shift 2 (14:00 - 22:00)</option>
                  <option value="Shift 3">Shift 3 (Night 22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone / Contact
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Line Allocation */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Assigned Production Lines
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllLines(!isAllLines)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    isAllLines 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ALL Production Lines
                </button>

                {!isAllLines && AVAILABLE_LINES.map(line => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => handleLineToggle(line)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      assignedLines.includes(line)
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-700/80">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
              >
                Save & Issue Credentials
              </button>
            </div>
          </form>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-800/40">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Lines Permitted</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${u.avatarColor}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-sky-400">
                    {u.employeeId}
                  </td>

                  <td className="py-3 px-4">
                    {editingUserId === u.id ? (
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleUpdateUserRole(u, e.target.value as RoleType)}
                        className="bg-slate-800 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-100"
                      >
                        <option value="Data Entry Staff">Data Entry Staff</option>
                        <option value="Production Supervisor">Production Supervisor</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Quality Inspector">Quality Inspector</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'Administrator' 
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                          : u.role === 'Production Supervisor'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : u.role === 'Store Manager'
                          ? 'bg-violet-950/80 text-violet-300 border-violet-700/60'
                          : 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                      }`}>
                        {u.role}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {u.assignedLines === 'ALL' ? (
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900">
                        ALL Lines
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedLines.map(l => (
                          <span key={l} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {u.shift}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        u.status === 'Active'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {u.status}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Edit role"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                          title="Delete staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
