import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover"
import { Calendar } from "../components/ui/calendar"
import { format } from "date-fns"

// Mock data for staff
const initialStaff = [
    {
        id: 1,
        fullName: 'Nguyen Van A',
        role: 'Nurse',
        dob: '1994-05-12',
        gender: 'Male',
        phone: '0123456789',
        email: 'nguyenvana@example.com',
        status: 'active' as 'active' | 'inactive',
    },
    {
        id: 2,
        fullName: 'Tran Thi B',
        role: 'Doctor',
        dob: '1988-07-19',
        gender: 'Female',
        phone: '0987654321',
        email: 'tranthib@example.com',
        status: 'active' as 'active' | 'inactive',
    },
    {
        id: 3,
        fullName: 'Le Van C',
        role: 'Caregiver',
        dob: '1995-03-22',
        gender: 'Male',
        phone: '0111111111',
        email: 'levanc@example.com',
        status: 'inactive' as 'active' | 'inactive',
    },
    // Add more mock data as needed
];

type Staff = typeof initialStaff[0];

const StaffManagementPage: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>(initialStaff);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        gender: '',
        role: '',
        phone: '',
        email: '',
        status: 'active' as 'active' | 'inactive',
    });

    const itemsPerPage = 5;

    // Filtered and searched staff
    const filteredStaff = useMemo(() => {
        return staff.filter(member => {
            const matchesSearch = member.fullName.toLowerCase().includes(search.toLowerCase());
            const matchesRole = !roleFilter || member.role === roleFilter;
            const matchesStatus = !statusFilter || member.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [staff, search, roleFilter, statusFilter]);

    // Paginated staff
    const paginatedStaff = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStaff, currentPage]);

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

    const getStatusBadge = (status: string) => {
        return status === 'active' ? (
            <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-500 text-white">Inactive</Badge>
        );
    };

    const handleAddEdit = () => {
        if (editingStaff) {
            setStaff(prev =>
                prev.map(mem =>
                    mem.id === editingStaff.id ? { ...mem, ...formData } : mem
                )
            );
        } else {
            const newStaff = {
                id: staff.length + 1,
                ...formData,
            };
            setStaff(prev => [...prev, newStaff]);
        }

        setIsDialogOpen(false);
        setEditingStaff(null);
        setFormData({
            fullName: '',
            dob: '',
            gender: '',
            role: '',
            phone: '',
            email: '',
            status: 'active',
        });
    };

    const handleEdit = (member: Staff) => {
        setEditingStaff(member);
        setFormData({
            fullName: member.fullName,
            dob: member.dob,
            gender: member.gender,
            role: member.role,
            phone: member.phone,
            email: member.email,
            status: member.status,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setStaff(prev => prev.filter(mem => mem.id !== id));
    };

    const uniqueRoles = [...new Set(staff.map(s => s.role))];

    return (
        <div className="container mx-auto p-6 space-y-6 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-800">Staff Management</h1>

            {/* Filters and Search */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl"></CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="search">Search by Name</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search staff..."
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="roleFilter">Filter by Role</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_roles">All Roles</SelectItem>
                                    {uniqueRoles.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="statusFilter">Filter by Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_statuses">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Staff Button */}
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingStaff(null)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Date of Birth</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            {formData.dob ? (
                                                <>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(new Date(formData.dob), "dd/MM/yyyy")}
                                                </>
                                            ) : (
                                                <>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    Pick a date
                                                </>
                                            )}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="p-0 w-auto scale-80 origin-top-left">
                                        <Calendar
                                            mode="single"
                                            selected={formData.dob ? new Date(formData.dob) : undefined}
                                            onSelect={(date) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    dob: date ? date.toISOString().split("T")[0] : ""
                                                }))
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Doctor">Doctor</SelectItem>
                                        <SelectItem value="Nurse">Nurse</SelectItem>
                                        <SelectItem value="Caregiver">Caregiver</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddEdit} className="w-full bg-blue-600 hover:bg-blue-700">
                                {editingStaff ? 'Update Staff' : 'Add Staff'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Staff Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Staff List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-base font-semibold text-center">ID</TableHead>
                                <TableHead className="text-base font-semibold text-center">Full Name</TableHead>
                                <TableHead className="text-base font-semibold text-center">Role</TableHead>
                                <TableHead className="text-base font-semibold text-center">DOB</TableHead>
                                <TableHead className="text-base font-semibold text-center">Gender</TableHead>
                                <TableHead className="text-base font-semibold text-center">Phone</TableHead>
                                <TableHead className="text-base font-semibold text-center">Email</TableHead>
                                <TableHead className="text-base font-semibold text-center">Status</TableHead>
                                <TableHead className="text-base font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedStaff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="text-base">{member.id}</TableCell>
                                    <TableCell className="text-base">{member.fullName}</TableCell>
                                    <TableCell className="text-base">{member.role}</TableCell>
                                    <TableCell className="text-base">{member.dob}</TableCell>
                                    <TableCell className="text-base">{member.gender}</TableCell>
                                    <TableCell className="text-base">{member.phone}</TableCell>
                                    <TableCell className="text-base">{member.email}</TableCell>
                                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDelete(member.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={page === currentPage}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default StaffManagementPage;
