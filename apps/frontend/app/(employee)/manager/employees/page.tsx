'use client';

import { useEmployee } from '@/app/context/EmployeeContext';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';

interface User {
  id: number | string; // Can be number for Google users, or string for local staff (staff_id)
  name?: string;
  email?: string;
  username?: string; // For local staff
  role: string;
  createdAt: string;
  type: 'google' | 'local'; // Differentiate between Google and local staff
}

const EmployeeManagementPage = () => {
  const { user: currentUser } = useEmployee();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL'); // 'ALL', 'CASHIER', 'MANAGER'
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);


  // State for password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // State for new staff creation modal
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CASHIER'); // Default role
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffConfirmPassword, setNewStaffConfirmPassword] = useState('');
  const [createStaffError, setCreateStaffError] = useState<string | null>(null);
  const [createStaffSuccess, setCreateStaffSuccess] = useState<string | null>(null);

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const { addToast } = useToast();



  useEffect(() => {
    const fetchAllEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Google OAuth users
        const googleUsersResponse = await fetch('/api/users');
        if (!googleUsersResponse.ok) {
          throw new Error('Failed to fetch Google users.');
        }
        const googleUsersData: User[] = (await googleUsersResponse.json()).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          type: 'google',
        }));

        // Fetch local staff
        const localStaffResponse = await fetch('/api/staff/local');
        if (!localStaffResponse.ok) {
          throw new Error('Failed to fetch local staff.');
        }
        const localStaffData: User[] = (await localStaffResponse.json()).map((s: any) => ({
          id: `local-${s.staff_id}`, // Prefix local staff IDs to ensure uniqueness
          name: s.username,
          username: s.username, // Store username separately
          role: s.role,
          createdAt: s.createdAt,
          type: 'local',
        }));

        // Combine and sort by creation date
        const combinedUsers = [...googleUsersData, ...localStaffData].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setUsers(combinedUsers);
      } catch (err: any) {
        addToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'MANAGER') {
      fetchAllEmployees();
    }
  }, [currentUser, addToast]);

  const handleRoleChange = async (userId: number | string, newRole: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    if (currentUser?.id === userId) {
      addToast({ message: "You cannot change your own role.", type: 'error' });
      return;
    }

    setConfirmTitle('Confirm Role Change');
    setConfirmMessage(`Are you sure you want to change the role of ${userToUpdate.name || userToUpdate.username || userToUpdate.email} to ${newRole}?`);
    setConfirmAction(() => async () => {
      try {
        let response;
        if (userToUpdate.type === 'google') {
          response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole }),
          });
        } else { // userToUpdate.type === 'local'
          const localStaffId = parseInt(String(userId).replace('local-', ''), 10);
          response = await fetch(`/api/staff/local/${localStaffId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: userToUpdate.username, role: newRole }), // Send current username and new role
          });
        }

        if (!response.ok) {
          throw new Error('Failed to update role.');
        }

        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        addToast({ message: 'Role updated successfully!', type: 'success' });
        setShowConfirmModal(false);
      } catch (err: any) {
        addToast({ message: err.message, type: 'error' });
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleNameChange = async (userId: number | string, newName: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate || userToUpdate.type === 'google') {
      // Name changes for Google OAuth users are not handled here
      return;
    }

    setConfirmTitle('Confirm Name Change');
    setConfirmMessage(`Are you sure you want to change the name of ${userToUpdate.name || userToUpdate.username} to ${newName}?`);
    setConfirmAction(() => async () => {
      try {
        const localStaffId = parseInt(String(userId).replace('local-', ''), 10);
        const response = await fetch(`/api/staff/local/${localStaffId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: newName, role: userToUpdate.role }), // Send new username and current role
        });

        if (!response.ok) {
          throw new Error('Failed to update username.');
        }

        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, name: newName, username: newName } : user
          )
        );
        addToast({ message: 'Name updated successfully!', type: 'success' });
        setShowConfirmModal(false);
      } catch (err: any) {
        addToast({ message: err.message, type: 'error' });
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const [editingUserId, setEditingUserId] = useState<number | string | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>('');

  const handleEditNameClick = (user: User) => {
    if (user.type === 'local') {
      setEditingUserId(user.id);
      setEditingUserName(user.name || user.username || '');
    }
  };

  const handleNameInputBlur = async (user: User) => {
    if (editingUserId === user.id && user.type === 'local' && editingUserName !== (user.name || user.username)) {
      await handleNameChange(user.id, editingUserName);
    }
    setEditingUserId(null);
    setEditingUserName('');
  };

  const handleNameInputKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, user: User) => {
    if (e.key === 'Enter') {
      await handleNameInputBlur(user);
    }
  };

  // Password modal handlers
  const handleChangePasswordClick = (userId: number | string) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      addToast({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      const localStaffId = parseInt(String(selectedUserId).replace('local-', ''), 10);
      const response = await fetch(`/api/staff/local/${localStaffId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password.');
      }

      addToast({ message: 'Password updated successfully!', type: 'success' });
      setShowPasswordModal(false); // Close modal on success
      // Optionally, re-fetch users or update state if necessary (though password change doesn't alter displayed user data)
    } catch (err: any) {
      addToast({ message: err.message, type: 'error' });
    }
  };

  // New Staff Creation handlers
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStaffError(null);
    setCreateStaffSuccess(null);

    if (!newStaffUsername) {
      addToast({ message: 'Username is required.', type: 'error' });
      return;
    }
    if (newStaffPassword.length < 6) {
      addToast({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newStaffPassword !== newStaffConfirmPassword) {
      addToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/staff/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newStaffUsername,
          role: newStaffRole,
          password: newStaffPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create staff member.');
      }

      const createdStaff: { staff_id: number; username: string; role: string; createdAt: string; } = await response.json();
      addToast({ message: `Staff member '${createdStaff.username}' created successfully!`, type: 'success' });
      // Add a small delay before closing the modal and clearing messages
      setTimeout(() => {
        setShowCreateStaffModal(false);
        // Clear form
        setNewStaffUsername('');
        setNewStaffRole('CASHIER');
        setNewStaffPassword('');
        setNewStaffConfirmPassword('');
      }, 500); // Close after 0.5 seconds, giving message time to be seen

      // Add the new staff member to the existing list
                setUsers(prevUsers => {
                  const newStaffMember: User = {
                    id: `local-${createdStaff.staff_id}`,
                    name: createdStaff.username,
                    username: createdStaff.username,
                    role: createdStaff.role,
                    createdAt: createdStaff.createdAt,
                    type: 'local',
                  };
                  const updatedUsers = [...prevUsers, newStaffMember];
                  return updatedUsers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                });
      

    } catch (err: any) {
      addToast({ message: err.message, type: 'error' });
    }
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === key ? sortConfig.direction : undefined;
  };

  const renderSortableHeader = (key: string, label: string) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => requestSort(key)}
    >
      <div className="flex items-center">
        {label}
        {getSortDirection(key) === 'ascending' && (
          <span className="ml-1">▲</span>
        )}
        {getSortDirection(key) === 'descending' && (
          <span className="ml-1">▼</span>
        )}
      </div>
    </th>
  );
  
  // Memoized and sorted users
  const filteredAndSortedUsers = React.useMemo(() => {
    let filterableUsers = [...users];

    // Apply role filter
    if (filterRole !== 'ALL') {
      filterableUsers = filterableUsers.filter(user => user.role === filterRole);
    }

    // Apply search term filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filterableUsers = filterableUsers.filter(
        user =>
          (user.name && user.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (user.username && user.username.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filterableUsers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name || a.username || '';
            bValue = b.name || b.username || '';
            break;
          case 'email':
            aValue = a.email || a.username || ''; // Combine email and username for sorting
            bValue = b.email || b.username || '';
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'role':
            aValue = a.role;
            bValue = b.role;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            aValue = '';
            bValue = '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filterableUsers;
  }, [users, filterRole, searchTerm, sortConfig]);
  
  if (currentUser?.role !== 'MANAGER') {
    return (
      <div className="text-center text-red-600 max-w-md mx-auto mt-10">
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p>You must be a manager to view this page.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-8">Loading...</div>;

        return (

          <div className="relative"> {/* Added relative for modal positioning */}

            <h1 className="text-3xl font-bold mb-6">Employee Management</h1>

            <div className="flex justify-between items-center mb-6">

              <div className="flex space-x-4">

                <input

                  type="text"

                  placeholder="Search by name, email, or username..."

                  className="p-2 border rounded-md w-64"

                  value={searchTerm}

                  onChange={(e) => setSearchTerm(e.target.value)}

                />

                <select

                  className="p-2 border rounded-md"

                  value={filterRole}

                  onChange={(e) => setFilterRole(e.target.value)}

                >

                  <option value="ALL">All Roles</option>

                  <option value="CASHIER">Cashier</option>

                  <option value="MANAGER">Manager</option>

                </select>

              </div>

      

            

              <div className="mb-4">

                <button

                  onClick={() => setShowCreateStaffModal(true)}

                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"

                >

                  Add New Local Staff

                </button>

              </div>

            </div>

      

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    {renderSortableHeader('name', 'Name')}

                    {renderSortableHeader('email', 'Email/Username')}

                    {renderSortableHeader('type', 'Type')}

                    {renderSortableHeader('role', 'Role')}

                    {renderSortableHeader('createdAt', 'Registered')}

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                  </tr>

                </thead>

                <tbody className="bg-white divide-y divide-gray-200">

                  {filteredAndSortedUsers.map((user) => (

                    <tr key={user.id}>

                      <td className="px-6 py-4 whitespace-nowrap">

                        {user.type === 'local' && editingUserId === user.id ? (

                          <input

                            type="text"

                            value={editingUserName}

                            onChange={(e) => setEditingUserName(e.target.value)}

                            onBlur={() => handleNameInputBlur(user)}

                            onKeyPress={(e) => handleNameInputKeyPress(e, user)}

                            className="border rounded-md p-1 w-full"

                            autoFocus

                          />

                        ) : (

                          <div className="flex items-center gap-2">

                            <span>{user.name}</span>

                            {user.type === 'local' && (

                              <button

                                onClick={() => handleEditNameClick(user)}

                                className="text-gray-500 hover:text-blue-600 focus:outline-none"

                                aria-label="Edit Name"

                              >

                                &#9998;

                              </button>

                            )}

                          </div>

                        )}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">{user.email || user.username || 'N/A'}</td>

                      <td className="px-6 py-4 whitespace-nowrap">{user.type === 'google' ? 'Google OAuth' : 'Local'}</td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        <select

                          value={user.role}

                          onChange={(e) => handleRoleChange(user.id, e.target.value)}

                          className="p-2 border rounded-md"

                          disabled={currentUser?.id === user.id}

                        >

                          <option value="CASHIER">Cashier</option>

                          <option value="MANAGER">Manager</option>

                        </select>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>

                      <td className="px-6 py-4 whitespace-nowrap">

                          {user.type === 'local' && (

                              <button

                                  onClick={() => handleChangePasswordClick(user.id)}

                                  className="ml-2 px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"

                              >

                                  Change Password

                              </button>

                          )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

      

      

            {showPasswordModal && (

              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">

                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">

                  <h2 className="text-2xl font-bold mb-4">Change Password</h2>

                  {passwordError && <p className="text-red-500 mb-4">{passwordError}</p>}

                  {passwordSuccess && <p className="text-green-500 mb-4">{passwordSuccess}</p>}

                  <form onSubmit={handlePasswordSubmit}>

                    <div className="mb-4">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">

                        New Password

                      </label>

                      <input

                        type="password"

                        id="newPassword"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={newPassword}

                        onChange={(e) => setNewPassword(e.target.value)}

                        required

                      />

                    </div>

                    <div className="mb-6">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">

                        Confirm New Password

                      </label>

                      <input

                        type="password"

                        id="confirmPassword"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={confirmPassword}

                        onChange={(e) => setConfirmPassword(e.target.value)}

                        required

                      />

                    </div>

                    <div className="flex items-center justify-between">

                      <button

                        type="submit"

                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"

                      >

                        Save Password

                      </button>

                      <button

                        type="button"

                        onClick={() => setShowPasswordModal(false)}

                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"

                      >

                        Cancel

                      </button>

                    </div>

                  </form>

                </div>

              </div>

            )}

      

      

            {showCreateStaffModal && (

              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">

                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">

                  <h2 className="text-2xl font-bold mb-4">Add New Local Staff</h2>

                  {createStaffError && <p className="text-red-500 mb-4">{createStaffError}</p>}

                  {createStaffSuccess && <p className="text-green-500 mb-4">{createStaffSuccess}</p>}

                  <form onSubmit={handleCreateStaffSubmit}>

                    <div className="mb-4">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newStaffUsername">

                        Username

                      </label>

                      <input

                        type="text"

                        id="newStaffUsername"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={newStaffUsername}

                        onChange={(e) => setNewStaffUsername(e.target.value)}

                        required

                      />

                    </div>

                    <div className="mb-4">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newStaffRole">

                        Role

                      </label>

                      <select

                        id="newStaffRole"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={newStaffRole}

                        onChange={(e) => setNewStaffRole(e.target.value)}

                        required

                      >

                        <option value="CASHIER">Cashier</option>

                        <option value="MANAGER">Manager</option>

                      </select>

                    </div>

                    <div className="mb-4">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newStaffPassword">

                        Password

                      </label>

                      <input

                        type="password"

                        id="newStaffPassword"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={newStaffPassword}

                        onChange={(e) => setNewStaffPassword(e.target.value)}

                        required

                      />

                    </div>

                    <div className="mb-6">

                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newStaffConfirmPassword">

                        Confirm Password

                      </label>

                      <input

                        type="password"

                        id="newStaffConfirmPassword"

                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        value={newStaffConfirmPassword}

                        onChange={(e) => setNewStaffConfirmPassword(e.target.value)}

                        required

                      />

                    </div>

                    <div className="flex items-center justify-between">

                      <button

                        type="submit"

                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"

                      >

                        Create Staff

                      </button>

                      <button

                        type="button"

                        onClick={() => {

                          setShowCreateStaffModal(false);

                          setCreateStaffError(null);

                          setCreateStaffSuccess(null);

                          setNewStaffUsername('');

                          setNewStaffPassword('');

                          setNewStaffConfirmPassword('');

                        }}

                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"

                      >

                        Cancel

                      </button>

                    </div>

                  </form>

                </div>

              </div>

            )}

      

      

            {/* Confirmation Modal */}

            <ConfirmationModal

              isOpen={showConfirmModal}

              title={confirmTitle}

              message={confirmMessage}

              onConfirm={async () => {

                if (confirmAction) {

                  await confirmAction();

                }

                setShowConfirmModal(false);

                setConfirmAction(null);

              }}

              onClose={() => {

                setShowConfirmModal(false);

                setConfirmAction(null);

              }}

            />

                      </div>

                    );

            
};

export default EmployeeManagementPage;