import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Download, TrendingUp, Users, Bed, AlertTriangle } from 'lucide-react';

const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-red-100"
];
const AdminReportsAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportType, setReportType] = useState('all');

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Report & Analytics</h1>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="utilization">Utilization</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex bg-white p-4 rounded-xl shadow-sm gap-2">
          <TabsTrigger 
          value="overview"
          className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Overview Dashboard</TabsTrigger>
          <TabsTrigger 
          value="revenue"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Revenue Analytics</TabsTrigger>
          <TabsTrigger 
          value="utilization"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Room Utilization</TabsTrigger>
          <TabsTrigger 
          value="patients"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Patient Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className={colors[0]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$125,000</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card className={colors[1]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Occupancy</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card className={colors[2]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">150</div>
                <p className="text-xs text-muted-foreground">+10 from last month</p>
              </CardContent>
            </Card>
            <Card className={colors[3]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidents Reported</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">-2 from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Line Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Occupancy Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Pie Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center mb-6">
                <p className="text-gray-500">Bar Chart Placeholder</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-center text-lg font-semibold'>Service</TableHead>
                    <TableHead className='text-center text-lg font-semibold'>Revenue</TableHead>
                    <TableHead className='text-center text-lg font-semibold'>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className='text-base'>Room Charges</TableCell>
                    <TableCell>$50,000</TableCell>
                    <TableCell>40%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='text-base'>Medical Services</TableCell>
                    <TableCell>$37,500</TableCell>
                    <TableCell>30%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='text-base'>Meals</TableCell>
                    <TableCell>$25,000</TableCell>
                    <TableCell>20%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='text-base'>Other</TableCell>
                    <TableCell>$12,500</TableCell>
                    <TableCell>10%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bed Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Bar Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Room Usage Table</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-center text-lg font-semibold'>Room</TableHead>
                      <TableHead className='text-center text-lg font-semibold'>Occupancy Rate</TableHead>
                      <TableHead className='text-center text-lg font-semibold'>Avg Stay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className='text-base'>
                      <TableCell>P101</TableCell>
                      <TableCell>90%</TableCell>
                      <TableCell>30 days</TableCell>
                    </TableRow>
                    <TableRow className='text-base'>
                      <TableCell>P102</TableCell>
                      <TableCell>85%</TableCell>
                      <TableCell>25 days</TableCell>
                    </TableRow>
                    <TableRow className='text-base'>
                      <TableCell>P203</TableCell>
                      <TableCell>95%</TableCell>
                      <TableCell>35 days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patients">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Pie Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Visit Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Line Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsAnalyticsPage;
