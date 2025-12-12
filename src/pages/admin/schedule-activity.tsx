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
import { Textarea } from '../components/ui/textarea';
import { Search, Plus, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover"
import { Calendar as ShadCalendar } from "../components/ui/calendar"
import { format } from "date-fns"


// Mock data for activities
const initialActivities = [
    {
        id: 1,
        title: 'Morning Yoga',
        category: 'Exercise',
        description: 'Gentle yoga session for seniors',
        date: '2023-10-01',
        startTime: '08:00',
        endTime: '09:00',
        assignedStaff: 'Nguyen Van A',
        participantsCount: 10,
        room: 'Gym',
    },
    {
        id: 2,
        title: 'Reading Club',
        category: 'Social',
        description: 'Group reading and discussion',
        date: '2023-10-02',
        startTime: '14:00',
        endTime: '15:30',
        assignedStaff: 'Tran Thi B',
        participantsCount: 8,
        room: 'Library',
    },
    {
        id: 3,
        title: 'Music Therapy',
        category: 'Therapy',
        description: 'Relaxing music session',
        date: '2023-10-03',
        startTime: '10:00',
        endTime: '11:00',
        assignedStaff: 'Le Van C',
        participantsCount: 12,
        room: 'Music Room',
    },
    // Add more mock data as needed
];

type Activity = typeof initialActivities[0];

const ScheduleActivitiesManagementPage: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>(initialActivities);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [roomFilter, setRoomFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [staffFilter, setStaffFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        assignedStaff: '',
        participantsCount: '',
        room: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const itemsPerPage = 5;

    // Get today's date for status calculation
    const today = new Date().toISOString().split('T')[0];

    // Filtered and searched activities
    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            const matchesSearch = activity.title.toLowerCase().includes(search.toLowerCase()) ||
                activity.description.toLowerCase().includes(search.toLowerCase());
            const matchesDate = !dateFilter || activity.date === dateFilter;
            const matchesRoom = !roomFilter || activity.room === roomFilter;
            const matchesCategory = !categoryFilter || activity.category === categoryFilter;
            const matchesStaff = !staffFilter || activity.assignedStaff === staffFilter;
            return matchesSearch && matchesDate && matchesRoom && matchesCategory && matchesStaff;
        });
    }, [activities, search, dateFilter, roomFilter, categoryFilter, staffFilter]);

    // Paginated activities
    const paginatedActivities = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredActivities, currentPage]);

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

    const getStatusBadge = (date: string) => {
        if (date < today) {
            return <Badge variant="secondary" className="bg-gray-500 text-white">Past</Badge>;
        } else if (date === today) {
            return <Badge variant="default" className="bg-blue-500 text-white">Today</Badge>;
        } else {
            return <Badge variant="default" className="bg-green-500 text-white">Upcoming</Badge>;
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.title.trim()) errors.title = 'Title is required';
        if (!formData.category) errors.category = 'Category is required';
        if (!formData.date) errors.date = 'Date is required';
        if (!formData.startTime) errors.startTime = 'Start time is required';
        if (!formData.endTime) errors.endTime = 'End time is required';
        if (!formData.assignedStaff.trim()) errors.assignedStaff = 'Assigned staff is required';
        if (!formData.room.trim()) errors.room = 'Room is required';
        if (formData.startTime >= formData.endTime) errors.endTime = 'End time must be after start time';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddEdit = () => {
        if (!validateForm()) return;
        if (editingActivity) {
            setActivities(prev =>
                prev.map(act => (act.id === editingActivity.id ? { ...act, ...formData, participantsCount: parseInt(formData.participantsCount) || 0 } : act))
            );
        } else {
            const newActivity = {
                id: activities.length + 1,
                ...formData,
                participantsCount: parseInt(formData.participantsCount) || 0,
            };
            setActivities(prev => [...prev, newActivity]);
        }
        setIsDialogOpen(false);
        setEditingActivity(null);
        setFormData({
            title: '',
            category: '',
            description: '',
            date: '',
            startTime: '',
            endTime: '',
            assignedStaff: '',
            participantsCount: '',
            room: '',
        });
        setFormErrors({});
    };

    const handleEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setFormData({
            title: activity.title,
            category: activity.category,
            description: activity.description,
            date: activity.date,
            startTime: activity.startTime,
            endTime: activity.endTime,
            assignedStaff: activity.assignedStaff,
            participantsCount: activity.participantsCount.toString(),
            room: activity.room,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setActivities(prev => prev.filter(act => act.id !== id));
    };

    const uniqueRooms = [...new Set(activities.map(a => a.room))];
    const uniqueCategories = [...new Set(activities.map(a => a.category))];
    const uniqueStaff = [...new Set(activities.map(a => a.assignedStaff))];

    return (
        <div className="container mx-auto p-6 space-y-6 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800">Schedule & Activities Management</h1>

            {/* Filters and Search */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Filters</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

                        {/* Search */}
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search activities..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {/* Date with Input */}
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData(prev => ({ ...prev, date: e.target.value }))
                                }
                            />
                            {formErrors.date && (
                                <p className="text-red-500 text-sm">{formErrors.date}</p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="roomFilter">Location</Label>
                            <Select value={roomFilter} onValueChange={setRoomFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Places" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_rooms">All Places</SelectItem>
                                    {uniqueRooms.map(room => (
                                        <SelectItem key={room} value={room}>{room}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="categoryFilter">Category</Label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_categories">All Categories</SelectItem>
                                    {uniqueCategories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Staff */}
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="staffFilter">Staff</Label>
                            <Select value={staffFilter} onValueChange={setStaffFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Staff" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_staff">All Staff</SelectItem>
                                    {uniqueStaff.map(staff => (
                                        <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Add Activity Button */}
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingActivity(null)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Activity
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                                {formErrors.title && <p className="text-red-500 text-sm">{formErrors.title}</p>}
                            </div>
                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={formData.category} onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Exercise">Exercise</SelectItem>
                                        <SelectItem value="Social">Social</SelectItem>
                                        <SelectItem value="Therapy">Therapy</SelectItem>
                                        <SelectItem value="Education">Education</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formErrors.category && <p className="text-red-500 text-sm">{formErrors.category}</p>}
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-1">
                                    <Label htmlFor="date">Date *</Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="relative">
                                                <Input
                                                    id="date"
                                                    readOnly
                                                    value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : ""}
                                                    placeholder="Select date"
                                                    className={`cursor-pointer ${formErrors.date ? "border-red-500" : ""}`}
                                                />

                                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none" />
                                            </div>
                                        </PopoverTrigger>

                                        <PopoverContent className="p-0 w-auto" align="start">
                                            <ShadCalendar
                                                mode="single"
                                                selected={formData.date ? new Date(formData.date) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            date: format(date, "yyyy-MM-dd")
                                                        }));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {formErrors.date && (
                                        <p className="text-red-500 text-sm">{formErrors.date}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="room">Room *</Label>
                                    <Input
                                        id="room"
                                        value={formData.room}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                    />
                                    {formErrors.room && <p className="text-red-500 text-sm">{formErrors.room}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    />
                                    {formErrors.startTime && <p className="text-red-500 text-sm">{formErrors.startTime}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    />
                                    {formErrors.endTime && <p className="text-red-500 text-sm">{formErrors.endTime}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="assignedStaff">Assigned Staff *</Label>
                                    <Input
                                        id="assignedStaff"
                                        value={formData.assignedStaff}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, assignedStaff: e.target.value }))}
                                    />
                                    {formErrors.assignedStaff && <p className="text-red-500 text-sm">{formErrors.assignedStaff}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="participantsCount">Participants Count</Label>
                                    <Input
                                        id="participantsCount"
                                        type="number"
                                        value={formData.participantsCount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, participantsCount: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddEdit} className="w-full bg-blue-600 hover:bg-blue-700">
                                {editingActivity ? 'Update Activity' : 'Add Activity'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Activities Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Activities</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-lg font-semibold text-center">Title</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Category</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Date</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Time</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Room</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Staff</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Participants</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Status</TableHead>
                                <TableHead className="text-lg font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedActivities.map((activity) => (
                                <TableRow className="hover:bg-transparent" key={activity.id}>
                                    <TableCell className="text-base font-medium">{activity.title}</TableCell>
                                    <TableCell className="text-base">{activity.category}</TableCell>
                                    <TableCell className="text-base">{activity.date}</TableCell>
                                    <TableCell className="text-base">{activity.startTime} - {activity.endTime}</TableCell>
                                    <TableCell className="text-base">{activity.room}</TableCell>
                                    <TableCell className="text-base">{activity.assignedStaff}</TableCell>
                                    <TableCell className="text-base">{activity.participantsCount}</TableCell>
                                    <TableCell>{getStatusBadge(activity.date)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2 rounded-md p-1 justify-center">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(activity)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDelete(activity.id)}>
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

export default ScheduleActivitiesManagementPage;