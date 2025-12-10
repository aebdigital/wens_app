import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'offline';
  lastOnline: string;
  ordersCreated: number;
  projectsCompleted: number;
}

const Zamestnanci: React.FC = () => {
  const { isDark } = useTheme();

  // Dummy employee data
  const [employees] = useState<Employee[]>([
    {
      id: 1,
      name: 'Peter Novák',
      email: 'peter.novak@wens.sk',
      role: 'Administrátor',
      status: 'online',
      lastOnline: '',
      ordersCreated: 145,
      projectsCompleted: 89
    },
    {
      id: 2,
      name: 'Mária Kováčová',
      email: 'maria.kovacova@wens.sk',
      role: 'Manažér projektu',
      status: 'online',
      lastOnline: '',
      ordersCreated: 98,
      projectsCompleted: 67
    },
    {
      id: 3,
      name: 'Ján Horák',
      email: 'jan.horak@wens.sk',
      role: 'Obchodník',
      status: 'offline',
      lastOnline: '2 hodiny',
      ordersCreated: 203,
      projectsCompleted: 124
    },
    {
      id: 4,
      name: 'Eva Szabová',
      email: 'eva.szabo@wens.sk',
      role: 'Technik',
      status: 'offline',
      lastOnline: '5 minút',
      ordersCreated: 67,
      projectsCompleted: 45
    },
    {
      id: 5,
      name: 'Tomáš Varga',
      email: 'tomas.varga@wens.sk',
      role: 'Obchodník',
      status: 'online',
      lastOnline: '',
      ordersCreated: 178,
      projectsCompleted: 98
    }
  ]);

  // Calculate statistics
  const totalOrders = employees.reduce((sum, emp) => sum + emp.ordersCreated, 0);
  const totalProjects = employees.reduce((sum, emp) => sum + emp.projectsCompleted, 0);
  const onlineEmployees = employees.filter(emp => emp.status === 'online').length;

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Zamestnanci</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Online zamestnanci</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{onlineEmployees}/{employees.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkom objednávok</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dokončené projekty</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div
        className={`rounded-lg overflow-x-auto mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        style={{
          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
        }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-white">Meno</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Rola</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Stav</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Posledná aktivita</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Počet objednávok</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Dokončené projekty</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#e11b28] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {employee.name}
                  </div>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{employee.email}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{employee.role}</td>
                <td className="px-4 py-3">
                  {employee.status === 'online' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Offline
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {employee.status === 'online' ? 'Práve teraz' : `Pred ${employee.lastOnline}`}
                </td>
                <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{employee.ordersCreated}</td>
                <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{employee.projectsCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Monthly Revenue Chart */}
        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tržby firmy</h3>

          {/* Chart Container */}
          <div className="relative pt-2 pb-6 pl-12 pr-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-2 bottom-6 flex flex-col justify-between text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>150k</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>100k</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>50k</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>0</span>
            </div>

            {/* Chart area with grid lines */}
            <div className="relative h-48">
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
                ))}
              </div>

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-around gap-2">
                {[
                  { month: 'Jan', revenue: 95000 },
                  { month: 'Feb', revenue: 105000 },
                  { month: 'Mar', revenue: 98000 },
                  { month: 'Apr', revenue: 112000 },
                  { month: 'Máj', revenue: 108000 },
                  { month: 'Jún', revenue: 115000 }
                ].map((data, index) => {
                  const maxRevenue = 150000;
                  const heightPercentage = (data.revenue / maxRevenue) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      {/* Revenue label above bar */}
                      <div className="mb-1 text-xs font-semibold" style={{ height: '16px' }}>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {(data.revenue / 1000).toFixed(0)}k
                        </span>
                      </div>

                      {/* Bar */}
                      <div
                        className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-around mt-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún'].map((month, index) => (
                <div key={index} className="flex-1 text-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Zamestnanci;