import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Search,
  Eye,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

// Mock data for SOS alerts
const initialSOSAlerts = [
  {
    id: "s1",
    residentName: "Nguyen Van A",
    room: "P203",
    alertTime: "2023-10-01 10:30",
    alertType: "Fall Detection",
    status: "active" as "active" | "in-progress" | "resolved",
    vitalSigns: "Heart Rate: 80 bpm, BP: 120/80",
  },
  {
    id: "s2",
    residentName: "Tran Thi B",
    room: "P105",
    alertTime: "2023-10-01 09:15",
    alertType: "Panic Button",
    status: "in-progress" as "active" | "in-progress" | "resolved",
    vitalSigns: "Heart Rate: 90 bpm, BP: 130/85",
  },
];

// Mock data for incidents
const initialIncidents = [
  {
    id: "i1",
    reporter: "Staff Tran Minh",
    resident: "Nguyen Van A",
    type: "Fall",
    time: "2023-10-01 10:30",
    severity: "high" as "low" | "medium" | "high",
    status: "open" as "open" | "investigating" | "resolved",
    description: "Resident fell in room",
    notes: "Checked by nurse, no injury",
    timeline: [
      { time: "10:30", action: "Incident reported" },
      { time: "10:35", action: "Nurse arrived" },
      { time: "10:40", action: "Resident checked, stable" },
    ],
  },
  {
    id: "i2",
    reporter: "Nurse Le Hoa",
    resident: "Tran Thi B",
    type: "Medication",
    time: "2023-09-30 14:20",
    severity: "medium" as "low" | "medium" | "high",
    status: "resolved" as "open" | "investigating" | "resolved",
    description: "Missed medication dose",
    notes: "Administered dose, monitored",
    timeline: [
      { time: "14:20", action: "Incident reported" },
      { time: "14:25", action: "Medication given" },
      { time: "15:00", action: "Resolved" },
    ],
  },
];

type SOSAlert = (typeof initialSOSAlerts)[0];
type Incident = (typeof initialIncidents)[0];

const AdminSOSIncidentPage: React.FC = () => {
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>(initialSOSAlerts);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedSOS, setSelectedSOS] = useState<SOSAlert | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isSOSDialogOpen, setIsSOSDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [residentFilter, setResidentFilter] = useState("");
  const [newNote, setNewNote] = useState("");

  // Summary stats
  const totalSOSToday = sosAlerts.length;
  const activeEmergencies = sosAlerts.filter(
    (s) => s.status === "active"
  ).length;
  const resolvedSOS = sosAlerts.filter((s) => s.status === "resolved").length;
  const avgResponseTime = "5 min"; // Mock

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        incident.description.toLowerCase().includes(search.toLowerCase()) ||
        incident.reporter.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity =
        !severityFilter || incident.severity === severityFilter;
      const matchesStatus = !statusFilter || incident.status === statusFilter;
      const matchesResident =
        !residentFilter || incident.resident === residentFilter;
      return (
        matchesSearch && matchesSeverity && matchesStatus && matchesResident
      );
    });
  }, [incidents, search, severityFilter, statusFilter, residentFilter]);

  const getSOSStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive">Active</Badge>;
      case "in-progress":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Resolved
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getIncidentSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Medium
          </Badge>
        );
      case "high":
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getIncidentStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "investigating":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Resolved
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleSOSAction = (id: string, action: "in-progress" | "resolved") => {
    setSOSAlerts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: action } : s))
    );
  };

  const handleViewSOS = (sos: SOSAlert) => {
    setSelectedSOS(sos);
    setIsSOSDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsIncidentDialogOpen(true);
  };

  const handleAddNote = () => {
    if (!selectedIncident || !newNote.trim()) return;
    const newTimelineEntry = {
      time: new Date().toLocaleTimeString(),
      action: `Note: ${newNote}`,
    };
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident.id
          ? { ...i, timeline: [...i.timeline, newTimelineEntry] }
          : i
      )
    );
    setNewNote("");
  };

  const handleChangeStatus = (
    status: "open" | "investigating" | "resolved"
  ) => {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((i) => (i.id === selectedIncident.id ? { ...i, status } : i))
    );
  };

  const uniqueResidents = [...new Set(incidents.map((i) => i.resident))];

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">
        SOS & Incident Center
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total SOS Today
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSOSToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Emergencies
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeEmergencies}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved SOS</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedSOS}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sos">SOS Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sos">
          {/* SOS Alerts Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">SOS Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg">Resident</TableHead>
                    <TableHead className="text-lg">Room</TableHead>
                    <TableHead className="text-lg">Alert Time</TableHead>
                    <TableHead className="text-lg">Type</TableHead>
                    <TableHead className="text-lg">Status</TableHead>
                    <TableHead className="text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sosAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="text-lg">
                        {alert.residentName}
                      </TableCell>
                      <TableCell className="text-lg">{alert.room}</TableCell>
                      <TableCell className="text-lg">
                        {alert.alertTime}
                      </TableCell>
                      <TableCell className="text-lg">
                        {alert.alertType}
                      </TableCell>
                      <TableCell>{getSOSStatusBadge(alert.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSOS(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {alert.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSOSAction(alert.id, "in-progress")
                              }
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {alert.status !== "resolved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSOSAction(alert.id, "resolved")
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          {/* Filters */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search incidents..."
                      value={search}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearch(e.target.value)
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="severityFilter">Severity</Label>
                  <Select
                    value={severityFilter}
                    onValueChange={setSeverityFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="severities">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="statuses">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">
                        Investigating
                      </SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="residentFilter">Resident</Label>
                  <Select
                    value={residentFilter}
                    onValueChange={setResidentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Residents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residents">All Residents</SelectItem>
                      {uniqueResidents.map((resident) => (
                        <SelectItem key={resident} value={resident}>
                          {resident}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incidents Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Incident Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg">Reporter</TableHead>
                    <TableHead className="text-lg">Resident</TableHead>
                    <TableHead className="text-lg">Type</TableHead>
                    <TableHead className="text-lg">Time</TableHead>
                    <TableHead className="text-lg">Severity</TableHead>
                    <TableHead className="text-lg">Status</TableHead>
                    <TableHead className="text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="text-lg">
                        {incident.reporter}
                      </TableCell>
                      <TableCell className="text-lg">
                        {incident.resident}
                      </TableCell>
                      <TableCell className="text-lg">{incident.type}</TableCell>
                      <TableCell className="text-lg">{incident.time}</TableCell>
                      <TableCell>
                        {getIncidentSeverityBadge(incident.severity)}
                      </TableCell>
                      <TableCell>
                        {getIncidentStatusBadge(incident.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewIncident(incident)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SOS Detail Dialog */}
      <Dialog open={isSOSDialogOpen} onOpenChange={setIsSOSDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>SOS Alert Details</DialogTitle>
          </DialogHeader>
          {selectedSOS && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">
                  Resident: {selectedSOS.residentName}
                </Label>
                <p>Room: {selectedSOS.room}</p>
                <p>Alert Time: {selectedSOS.alertTime}</p>
                <p>Type: {selectedSOS.alertType}</p>
              </div>
              <div>
                <Label className="font-semibold">Vital Signs</Label>
                <p>{selectedSOS.vitalSigns}</p>
              </div>
              <div>
                <Label className="font-semibold">Map Placeholder</Label>
                <div className="w-full h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-200 text-black">Assign Staff</Button>
                {selectedSOS.status === "active" && (
                  <Button
                    className="text-black bg-yellow-200"
                    onClick={() => {
                      handleSOSAction(selectedSOS.id, "in-progress");
                      setIsSOSDialogOpen(false);
                    }}
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedSOS.status !== "resolved" && (
                  <Button
                    className="text-black bg-green-200"
                    onClick={() => {
                      handleSOSAction(selectedSOS.id, "resolved");
                      setIsSOSDialogOpen(false);
                    }}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSOSIncidentPage;
