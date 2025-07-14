import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentActivity {
  id: string;
  name: string;
  created_at: string;
  objective: string;
}

interface RecentIntervention {
  id: string;
  date: string;
  student_name: string;
  activity_name: string;
}

interface DashboardRecentActivityProps {
  recentActivities: RecentActivity[];
  recentInterventions: RecentIntervention[];
}

export const DashboardRecentActivity = ({
  recentActivities,
  recentInterventions
}: DashboardRecentActivityProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actividades Recientes
          </CardTitle>
          <CardDescription>
            Últimas 5 actividades creadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay actividades recientes</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="border-l-2 border-primary pl-3">
                  <h4 className="font-medium text-sm">{activity.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {activity.objective?.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Intervenciones Recientes
          </CardTitle>
          <CardDescription>
            Últimas 5 intervenciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentInterventions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay intervenciones recientes</p>
          ) : (
            <div className="space-y-3">
              {recentInterventions.map((intervention) => (
                <div key={intervention.id} className="border-l-2 border-secondary pl-3">
                  <h4 className="font-medium text-sm">{intervention.activity_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Estudiante: {intervention.student_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(intervention.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};