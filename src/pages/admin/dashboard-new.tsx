import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Users,
  UserCheck,
  Bed,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";
import { getDashboardStats, getAdminRevenueAnalytics, getAdminAnalyticsSummary } from "@/apis/admin.api";
import { getPaymentStatistics, getRevenueByPaymentMethod } from "@/apis/payment.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";
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
  Area,
} from "recharts";

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#8b5cf6'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  
  // Revenue data states
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [revenueSeries, setRevenueSeries] = useState<Array<{ date: string; value: number }>>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<Array<{ method: string; totalAmount: number; count: number }>>([]);
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null);

  useEffect(() => {
    loadStats();
    loadRevenueData();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error("Không thể tải thống kê bảng điều khiển");
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      setRevenueLoading(true);
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 6); // 6 tháng gần nhất

      // Load revenue summary
      const summaryRes = await getAdminAnalyticsSummary();
      setRevenueSummary(summaryRes.data);

      // Load revenue analytics (6 tháng gần nhất, theo tháng)
      const revenueRes = await getAdminRevenueAnalytics({
        from: start.toISOString(),
        to: end.toISOString(),
        granularity: 'month',
      });
      setRevenueSeries(revenueRes.data.series || []);

      // Load revenue by payment method
      const methodRes = await getRevenueByPaymentMethod({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
      setRevenueByMethod(methodRes.data || []);

      // Load payment statistics
      const statsRes = await getPaymentStatistics({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
      setPaymentStatistics(statsRes.data);
    } catch (error: any) {
      console.error("Error loading revenue data:", error);
      toast.error("Không thể tải dữ liệu doanh thu");
    } finally {
      setRevenueLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">Đang tải...</p>
      </div>
    );
  }

  const overviewStats = [
    {
      title: "Tổng số cư dân",
      value: stats?.total_residents || 0,
      icon: Users,
      color: "bg-blue-100",
    },
    {
      title: "Cư dân đang hoạt động",
      value: stats?.active_residents || 0,
      icon: UserCheck,
      color: "bg-green-100",
    },
    {
      title: "Nhân viên",
      value: stats?.total_staff || 0,
      icon: UserCheck,
      color: "bg-yellow-100",
    },
    {
      title: "Cảnh báo",
      value: stats?.alerts_count || 0,
      icon: AlertTriangle,
      color: "bg-red-100",
    },
  ];

  return (
    <div className="w-full relative">
      <div className="container mx-auto p-6 space-y-6 bg-transparent">
        <h1 className="text-3xl font-bold text-gray-800">
          Bảng điều khiển tổng quan
        </h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`${stat.color} shadow-md border-gray-300`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
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
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl">Tổng quan Phòng & Giường</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${stats?.occupancy_rate || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {stats?.occupancy_rate || 0}%
              </span>
            </div>
            <p className="text-lg mt-2">
              Đang sử dụng: {stats?.occupied_beds || 0} /{" "}
              {stats?.total_beds || 0} giường
            </p>
          </CardContent>
        </Card>

        {/* Tasks Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Tổng công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.total_tasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Đang chờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.pending_tasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.completed_tasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {revenueLoading ? (
                  <span className="text-sm">Đang tải...</span>
                ) : (
                  formatCurrency(revenueSummary?.total_revenue || 0)
                )}
              </div>
              <p className="text-xs text-blue-600 mt-1">Tất cả thời gian</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu tháng (MRR)</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {revenueLoading ? (
                  <span className="text-sm">Đang tải...</span>
                ) : (
                  formatCurrency(revenueSummary?.mrr || 0)
                )}
              </div>
              <p className="text-xs text-green-600 mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu năm (ARR)</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {revenueLoading ? (
                  <span className="text-sm">Đang tải...</span>
                ) : (
                  formatCurrency(revenueSummary?.arr || 0)
                )}
              </div>
              <p className="text-xs text-purple-600 mt-1">Annual Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hợp đồng đang hoạt động</CardTitle>
              <Wallet className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {revenueLoading ? (
                  <span className="text-sm">Đang tải...</span>
                ) : (
                  revenueSummary?.active_contracts || 0
                )}
              </div>
              <p className="text-xs text-orange-600 mt-1">Active contracts</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="bg-white border-gray-300 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Xu hướng doanh thu 6 tháng gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : revenueSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Tháng: ${formatDate(label)}`}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Doanh thu"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Không có dữ liệu doanh thu</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Payment Method - Bar Chart */}
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Doanh thu theo phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : revenueByMethod.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMethod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="method" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="totalAmount" 
                      fill="#3b82f6" 
                      name="Doanh thu"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Không có dữ liệu</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status Distribution - Pie Chart */}
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Phân bổ theo trạng thái thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : paymentStatistics?.paymentByStatus && paymentStatistics.paymentByStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentStatistics.paymentByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, _count }) => `${status}: ${_count.status}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="_count.status"
                        nameKey="status"
                      >
                        {paymentStatistics.paymentByStatus.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value} giao dịch`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {paymentStatistics.paymentByStatus.map((item: any, index: number) => {
                      const total = paymentStatistics.paymentByStatus.reduce(
                        (sum: number, p: any) => sum + p._count.status, 
                        0
                      );
                      const percentage = ((item._count.status / total) * 100).toFixed(1);
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="font-medium">{item.status}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">{item._count.status} giao dịch</span>
                            <span className="font-semibold text-gray-800">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Không có dữ liệu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate(path.adminResidents)}
                className="h-12 bg-[#5985d8] text-lg text-white hover:bg-[#5183c9]"
              >
                Quản lý cư dân
              </Button>
              <Button
                onClick={() => navigate(path.adminStaff)}
                className="h-12 bg-[#5985d8] text-lg text-white hover:bg-[#5183c9]"
              >
                Quản lý nhân viên
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
