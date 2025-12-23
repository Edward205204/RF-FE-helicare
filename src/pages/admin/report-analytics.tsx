import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Download, TrendingUp, Users, Bed, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  getPaymentStatistics,
  getRevenueAnalytics,
  getRevenueByPaymentMethod
} from '@/apis/payment.api';
import { toast } from 'react-toastify';

const colors = [
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-red-100"
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminReportsAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportType, setReportType] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Statistics data
  const [statistics, setStatistics] = useState<any>(null);
  const [revenueSeries, setRevenueSeries] = useState<Array<{ date: string; value: number }>>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<Array<{ method: string; totalAmount: number; count: number }>>([]);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('month');

  // Tính toán date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case 'last-7-days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last-30-days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last-90-days':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start = new Date('2000-01-01'); // All time
    }
    
    return { start, end };
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      // Fetch statistics
      const statsRes = await getPaymentStatistics({
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      setStatistics(statsRes.data);

      // Fetch revenue analytics
      const revenueRes = await getRevenueAnalytics({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        granularity
      });
      setRevenueSeries(revenueRes.data.series);

      // Fetch revenue by method
      const methodRes = await getRevenueByPaymentMethod({
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      setRevenueByMethod(methodRes.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, granularity]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (granularity === 'day') {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } else if (granularity === 'week') {
      return dateStr;
    } else {
      return new Date(dateStr + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
    }
  };

  // Calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Report & Analytics</h1>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateRange">Khoảng thời gian</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">7 ngày qua</SelectItem>
                  <SelectItem value="last-30-days">30 ngày qua</SelectItem>
                  <SelectItem value="last-90-days">90 ngày qua</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="granularity">Độ chi tiết</Label>
              <Select value={granularity} onValueChange={(val) => setGranularity(val as 'day' | 'week' | 'month')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="week">Theo tuần</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={fetchData} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Đang tải...' : 'Làm mới'}
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
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="revenue"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Doanh thu
          </TabsTrigger>
          <TabsTrigger 
            value="utilization"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Sử dụng phòng
          </TabsTrigger>
          <TabsTrigger 
            value="patients"
            className="h-10 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow text-center"
          >
            Chỉ số bệnh nhân
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className={colors[0]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : statistics ? formatCurrency(statistics.successfulAmount) : '0 VND'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics ? `${statistics.successfulPayments} giao dịch thành công` : ''}
                </p>
              </CardContent>
            </Card>
            <Card className={colors[1]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : statistics ? statistics.totalPayments : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics ? `${statistics.successfulPayments} thành công, ${statistics.failedPayments} thất bại` : ''}
                </p>
              </CardContent>
            </Card>
            <Card className={colors[2]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : statistics && statistics.totalPayments > 0
                    ? `${calculatePercentage(statistics.successfulPayments, statistics.totalPayments)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics ? `${statistics.successfulPayments}/${statistics.totalPayments} giao dịch` : ''}
                </p>
              </CardContent>
            </Card>
            <Card className={colors[3]}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giao dịch thất bại</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : statistics ? statistics.failedPayments : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics ? `${calculatePercentage(statistics.failedPayments, statistics.totalPayments)}% tổng giao dịch` : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                ) : revenueSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Doanh thu"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                ) : revenueByMethod.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueByMethod}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalAmount"
                        nameKey="method"
                      >
                        {revenueByMethod.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng doanh thu theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                ) : revenueSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Doanh thu"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                ) : revenueByMethod.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByMethod}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" />
                        <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="totalAmount" fill="#3b82f6" name="Doanh thu" />
                      </BarChart>
                    </ResponsiveContainer>
                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead className='text-center text-lg font-semibold'>Phương thức</TableHead>
                          <TableHead className='text-center text-lg font-semibold'>Doanh thu</TableHead>
                          <TableHead className='text-center text-lg font-semibold'>Số giao dịch</TableHead>
                          <TableHead className='text-center text-lg font-semibold'>Tỷ lệ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueByMethod.map((item, index) => {
                          const totalRevenue = revenueByMethod.reduce((sum, r) => sum + r.totalAmount, 0);
                          const percentage = calculatePercentage(item.totalAmount, totalRevenue);
                          return (
                            <TableRow key={index}>
                              <TableCell className='text-base text-center'>{item.method}</TableCell>
                              <TableCell className='text-base text-center'>{formatCurrency(item.totalAmount)}</TableCell>
                              <TableCell className='text-base text-center'>{item.count}</TableCell>
                              <TableCell className='text-base text-center'>{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500">Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status Distribution */}
            {statistics && statistics.paymentByStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Phân bổ theo trạng thái</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statistics.paymentByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, _count }) => `${status}: ${_count.status}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="_count.status"
                        nameKey="status"
                      >
                        {statistics.paymentByStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
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
