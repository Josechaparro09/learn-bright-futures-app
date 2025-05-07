import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BarrierData = {
  name: string;
  count: number;
}

type LearningStyleData = {
  name: string;
  count: number;
  color: string;
}

type ActivityData = {
  month: string;
  count: number;
}

interface DashboardStatsProps {
  barrierData: BarrierData[];
  learningStyleData: LearningStyleData[];
  activityData: ActivityData[];
}

/**
 * Componente para mostrar estadísticas en el dashboard
 */
const DashboardStats = ({ barrierData, learningStyleData, activityData }: DashboardStatsProps) => {
  // Colores para los gráficos
  const CHART_COLORS = useMemo(() => ({
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f97316',
    muted: '#94a3b8',
  }), []);

  return (
    <Tabs defaultValue="barriers" className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Estadísticas</CardTitle>
          <TabsList>
            <TabsTrigger value="barriers">Barreras</TabsTrigger>
            <TabsTrigger value="styles">Estilos</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
          </TabsList>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <TabsContent value="barriers" className="mt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barrierData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 60,
                }}
              >
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} actividades`, 'Cantidad']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Distribución de actividades por barrera de aprendizaje
          </p>
        </TabsContent>

        <TabsContent value="styles" className="mt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={learningStyleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {learningStyleData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || CHART_COLORS.muted} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} actividades`, 'Cantidad']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Distribución de actividades por estilo de aprendizaje
          </p>
        </TabsContent>

        <TabsContent value="activities" className="mt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activityData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} actividades`, 'Cantidad']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Número de actividades creadas por mes
          </p>
        </TabsContent>
      </CardContent>
    </Tabs>
  );
};

export default DashboardStats; 