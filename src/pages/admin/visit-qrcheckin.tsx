import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { CheckCircle, XCircle, Eye, QrCode, Users, Clock, CheckSquare } from 'lucide-react';
import QRCode from 'qrcode';

const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-red-100"
];

// Mock data for visits
const initialVisits = [
    {
        id: 'v1',
        visitorName: 'Tran Minh Khoa',
        phone: '0901234567',
        relationship: 'Son',
        residentName: 'Nguyen Van A',
        room: 'P203',
        date: '2025-02-18',
        slot: '15:00 - 16:00',
        status: 'pending' as 'pending' | 'approved' | 'rejected' | 'checked-in',
        qrCode: '',
        notes: 'First visit this month',
    },
    {
        id: 'v2',
        visitorName: 'Le Thi Lan',
        phone: '0912345678',
        relationship: 'Daughter',
        residentName: 'Tran Thi B',
        room: 'P105',
        date: '2025-02-18',
        slot: '10:00 - 11:00',
        status: 'approved' as 'pending' | 'approved' | 'rejected' | 'checked-in',
        qrCode: '',
        notes: 'Regular check-in',
    },
];

type Visit = typeof initialVisits[0];

// Mock data for slots
const initialSlots = [
    { id: 's1', time: '09:00 - 10:00', active: true, capacity: 5 },
    { id: 's2', time: '10:00 - 11:00', active: true, capacity: 4 },
    { id: 's3', time: '15:00 - 16:00', active: true, capacity: 3 },
];

type Slot = typeof initialSlots[0];

const VisitCheckinAdmin: React.FC = () => {
    const [visits, setVisits] = useState<Visit[]>(initialVisits);
    const [slots, setSlots] = useState<Slot[]>(initialSlots);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [qrInput, setQrInput] = useState('');
    const [checkinAlert, setCheckinAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Summary stats
    const totalVisitsToday = visits.filter(v => v.date === '2025-02-18').length;
    const pendingApprovals = visits.filter(v => v.status === 'pending').length;
    const approvedVisits = visits.filter(v => v.status === 'approved').length;
    const checkinsToday = visits.filter(v => v.status === 'checked-in' && v.date === '2025-02-18').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
            case 'approved':
                return <Badge variant="default" className="bg-green-500 text-white">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'checked-in':
                return <Badge variant="default" className="bg-blue-500 text-white">Checked-in</Badge>;
            default:
                return <Badge>Unknown</Badge>;
        }
    };

    const handleApprove = (id: string) => {
        setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' as const } : v));
    };

    const handleReject = (id: string) => {
        setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected' as const } : v));
    };

    const handleViewDetails = (visit: Visit) => {
        setSelectedVisit(visit);
        setIsDetailDialogOpen(true);
    };

    const generateQR = async (visit: Visit) => {
        const qrData = `Visit ID: ${visit.id}, Visitor: ${visit.visitorName}, Resident: ${visit.residentName}, Date: ${visit.date}, Slot: ${visit.slot}`;
        try {
            const qrBase64 = await QRCode.toDataURL(qrData);
            setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, qrCode: qrBase64 } : v));
        } catch (err) {
            console.error('QR generation failed', err);
        }
    };

    const handleCheckin = () => {
        const visit = visits.find(v => v.qrCode && v.qrCode.includes(qrInput));
        if (visit && visit.status === 'approved') {
            setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'checked-in' as const } : v));
            setCheckinAlert({ type: 'success', message: `Checked in: ${visit.visitorName} visiting ${visit.residentName}` });
        } else {
            setCheckinAlert({ type: 'error', message: 'Invalid QR code or visit not approved' });
        }
        setQrInput('');
        setTimeout(() => setCheckinAlert(null), 3000);
    };

    const toggleSlotActive = (id: string) => {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const updateSlotCapacity = (id: string, capacity: number) => {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, capacity } : s));
    };

    return (
        <div className="container mx-auto p-6 space-y-6 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-800">Visit & QR Check-in Management</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={`${colors[0]} shadow-md`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" >
                        <CardTitle className="text-base font-medium">Total Visits Today</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVisitsToday}</div>
                    </CardContent>
                </Card>
                <Card className={`${colors[1]} shadow-md`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" >
                        <CardTitle className="text-base font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingApprovals}</div>
                    </CardContent>
                </Card>
                <Card className={`${colors[2]} shadow-md`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" >
                        <CardTitle className="text-base font-medium">Approved Visits</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedVisits}</div>
                    </CardContent>
                </Card>
                <Card className={`${colors[3]} shadow-md`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" >
                        <CardTitle className="text-base font-medium">Check-ins Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{checkinsToday}</div>
                    </CardContent>
                </Card>
            </div>
            <div className=" flex justify-center gap-4 mt-4 mb-2">
                <Tabs defaultValue="visits" className="w-full max-w-[1100px]">
                    <TabsList className="flex bg-white p-4 rounded-xl shadow-sm gap-2">
                        <TabsTrigger
                            value="visits"
                            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
                        >
                            Visit List
                        </TabsTrigger>

                        <TabsTrigger
                            value="slots"
                            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
                        >
                            Slot Configuration
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="visits">
                        {/* Visit Management Table */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Visit Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-lg font-semibold text-center">Visitor</TableHead>
                                            <TableHead className="text-lg font-semibold text-center">Resident</TableHead>
                                            <TableHead className="text-lg font-semibold text-center">Date</TableHead>
                                            <TableHead className="text-lg font-semibold text-center">Time Slot</TableHead>
                                            <TableHead className="text-lg font-semibold text-center">Status</TableHead>
                                            <TableHead className="text-lg font-semibold text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visits.map((visit) => (
                                            <TableRow key={visit.id}>
                                                <TableCell className="text-base">{visit.visitorName}</TableCell>
                                                <TableCell className="text-base">{visit.residentName}</TableCell>
                                                <TableCell className="text-base">{visit.date}</TableCell>
                                                <TableCell className="text-base">{visit.slot}</TableCell>
                                                <TableCell>{getStatusBadge(visit.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        {visit.status === 'pending' && (
                                                            <>
                                                                <Button variant="outline" size="sm" onClick={() => handleApprove(visit.id)}>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleReject(visit.id)}>
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(visit)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* QR Check-in Panel */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">QR Check-in</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Scan or paste QR content here"
                                        value={qrInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQrInput(e.target.value)}
                                    />
                                    <Button onClick={handleCheckin} className="bg-blue-600 hover:bg-blue-700">
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Check-in
                                    </Button>
                                    {checkinAlert && (
                                        <Alert variant={checkinAlert.type === 'success' ? 'default' : 'destructive'}>
                                            <AlertDescription>{checkinAlert.message}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="slots">
                        {/* Slot Configuration */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Slot Configuration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {slots.map((slot) => (
                                        <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <Label className="text-lg">{slot.time}</Label>
                                                <Switch
                                                    checked={slot.active}
                                                    onCheckedChange={() => toggleSlotActive(slot.id)}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Label>Capacity:</Label>
                                                <Input
                                                    type="number"
                                                    value={slot.capacity}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSlotCapacity(slot.id, parseInt(e.target.value, 10) || 0)}
                                                    className="w-20"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Visit Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Visit Details</DialogTitle>
                    </DialogHeader>
                    {selectedVisit ? (
                        <div className="space-y-4">
                            <div>
                                <Label className="font-semibold">Visitor Info</Label>
                                <p>Name: {selectedVisit?.visitorName}</p>
                                <p>Phone: {selectedVisit?.phone}</p>
                                <p>Relationship: {selectedVisit?.relationship}</p>
                            </div>
                            <div>
                                <Label className="font-semibold">Resident Info</Label>
                                <p>Name: {selectedVisit?.residentName}</p>
                                <p>Room: {selectedVisit?.room}</p>
                            </div>
                            <div>
                                <Label className="font-semibold">Schedule</Label>
                                <p>Date: {selectedVisit?.date}</p>
                                <p>Time Slot: {selectedVisit?.slot}</p>
                            </div>
                            <div>
                                <Label className="font-semibold">Notes</Label>
                                <Textarea value={selectedVisit?.notes || ''} readOnly />
                            </div>
                            {selectedVisit?.status === 'approved' && selectedVisit?.qrCode && (
                                <div>
                                    <Label className="font-semibold">QR Code</Label>
                                    <img src={selectedVisit?.qrCode} alt="QR Code" className="w-32 h-32" />
                                </div>
                            )}
                            <div className="flex space-x-2">
                                {selectedVisit?.status === 'pending' && (
                                    <>
                                        <Button onClick={() => { if (!selectedVisit) return; handleApprove(selectedVisit.id); setIsDetailDialogOpen(false); }}>
                                            Approve
                                        </Button>
                                        <Button variant="destructive" onClick={() => { if (!selectedVisit) return; handleReject(selectedVisit.id); setIsDetailDialogOpen(false); }}>
                                            Reject
                                        </Button>
                                    </>
                                )}
                                {selectedVisit?.status === 'approved' && !selectedVisit?.qrCode && (
                                    <Button onClick={() => { if (!selectedVisit) return; generateQR(selectedVisit); }}>
                                        Generate QR Code
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default VisitCheckinAdmin;
