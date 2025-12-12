import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Users, UserCheck, Bed, Wrench, BarChart3, Settings, FileText } from "lucide-react";

// Mock data
const overviewStats = [
    { title: "Total Residents", value: 150, icon: Users },
    { title: "Active Staff", value: 25, icon: UserCheck },
    { title: "Available Beds", value: 20, icon: Bed },
    { title: "Pending Maintenance", value: 5, icon: Wrench },
];

const occupancyRate = 75; // percentage
const totalBeds = 200;
const occupiedBeds = 150;

const recentActivities = [
    { timestamp: "2023-10-01 10:30", user: "Admin", action: "Updated Room", details: "Room P203 metadata changed" },
    { timestamp: "2023-10-01 09:15", user: "Staff", action: "Admitted Resident", details: "New resident Nguyen Van A" },
    { timestamp: "2023-09-30 14:45", user: "Admin", action: "Created Report", details: "Monthly occupancy report" },
    { timestamp: "2023-09-30 12:00", user: "Staff", action: "Maintenance Ticket", details: "Room P105 bed B01 fixed" },
];

const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-red-100"
];

const AdminDashboardPage: React.FC = () => {
    return (
        <div className="w-full relative">
            <div className="container mx-auto p-6 space-y-6 bg-transparent">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewStats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className={`${colors[index]} shadow-md`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Room & Bed Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Room & Bed Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-blue-600 h-4 rounded-full"
                                    style={{ width: `${occupancyRate}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium">{occupancyRate}%</span>
                        </div>
                        <p className="text-lg mt-2">Current occupancy: {occupiedBeds} / {totalBeds} beds</p>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button className="h-12 bg-blue-500 text-lg text-white hover:bg-blue-600">Manage Rooms</Button>
                            <Button className="h-12 bg-blue-500 text-lg text-white hover:bg-blue-600">Manage Staff</Button>
                            <Button className="h-12 bg-blue-500 text-lg text-white hover:bg-blue-600">System Settings</Button>
                            <Button className="h-12 bg-blue-500 text-lg text-white hover:bg-blue-600">View Reports</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-lg text-center font-bold">Timestamp</TableHead>
                                    <TableHead className="text-lg text-center font-bold">User</TableHead>
                                    <TableHead className="text-lg text-center font-bold">Action</TableHead>
                                    <TableHead className="text-lg text-center font-bold">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivities.map((activity, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-base">{activity.timestamp}</TableCell>
                                        <TableCell className="text-base">{activity.user}</TableCell>
                                        <TableCell className="text-base">{activity.action}</TableCell>
                                        <TableCell className="text-base">{activity.details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
