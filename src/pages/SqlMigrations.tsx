import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import Navbar from "@/components/Navbar";

/**
 * Migraciones SQL para crear las funciones necesarias para el dashboard
 */

const migrations = [
  {
    name: "exec_sql",
    description: "Función para ejecutar consultas SQL dinámicas (necesaria para crear otras funciones)",
    sql: `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS VOID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
    `
  },
  {
    name: "get_barrier_activity_counts",
    description: "Obtiene el conteo de actividades por barrera de aprendizaje",
    sql: `
    CREATE OR REPLACE FUNCTION get_barrier_activity_counts()
    RETURNS TABLE (name text, count bigint) 
    LANGUAGE SQL
    AS $$
      SELECT 
        barriers.name, 
        COUNT(activity_barriers.activity_id) as count
      FROM 
        barriers
      LEFT JOIN 
        activity_barriers ON barriers.id = activity_barriers.barrier_id
      GROUP BY 
        barriers.name
      ORDER BY 
        count DESC;
    $$;
    `
  },
  {
    name: "get_learning_style_activity_counts",
    description: "Obtiene el conteo de actividades por estilo de aprendizaje",
    sql: `
    CREATE OR REPLACE FUNCTION get_learning_style_activity_counts()
    RETURNS TABLE (name text, count bigint, color text) 
    LANGUAGE SQL
    AS $$
      SELECT 
        learning_styles.name, 
        COUNT(activity_learning_styles.activity_id) as count,
        learning_styles.color
      FROM 
        learning_styles
      LEFT JOIN 
        activity_learning_styles ON learning_styles.id = activity_learning_styles.learning_style_id
      GROUP BY 
        learning_styles.name, learning_styles.color
      ORDER BY 
        count DESC;
    $$;
    `
  },
  {
    name: "get_activities_by_month",
    description: "Obtiene el conteo de actividades creadas por mes",
    sql: `
    CREATE OR REPLACE FUNCTION get_activities_by_month()
    RETURNS TABLE (month text, count bigint) 
    LANGUAGE SQL
    AS $$
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COUNT(*) as count
      FROM 
        activities
      WHERE 
        created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY 
        DATE_TRUNC('month', created_at)
      ORDER BY 
        DATE_TRUNC('month', created_at);
    $$;
    `
  }
];

const SqlMigrations = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const runMigration = async (migration: typeof migrations[0]) => {
    setIsLoading(prev => ({ ...prev, [migration.name]: true }));
    
    try {
      // Intenta ejecutar la consulta directamente
      // @ts-ignore - ignoramos el error de typescript ya que estamos usando una función SQL personalizada
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: migration.sql 
      });
      
      if (error) {
        // Si exec_sql no existe, mostrar un mensaje específico
        if (error.message.includes("does not exist")) {
          throw new Error("La función exec_sql no existe. Por favor, crea manualmente la función en la base de datos o en la consola de Supabase SQL.");
        }
        throw error;
      }
      
      setSuccess(prev => ({ ...prev, [migration.name]: true }));
      toast({
        title: "Migración exitosa",
        description: `La función ${migration.name} se ha creado correctamente.`,
      });
    } catch (error) {
      console.error(`Error en migración ${migration.name}:`, error);
      toast({
        variant: "destructive",
        title: "Error en la migración",
        description: `No se pudo crear la función ${migration.name}. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [migration.name]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Migraciones SQL</h1>
          <p className="text-gray-600 mt-2">
            Ejecuta estas migraciones para crear las funciones necesarias para el dashboard.
          </p>
          <div className="mt-4 p-4 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
            <p><strong>Nota importante:</strong> Ejecuta las migraciones en orden, comenzando por "exec_sql".</p>
            <p className="mt-2">
              Si recibes un error sobre "función no existe", deberás crear la función exec_sql directamente
              en la consola SQL de Supabase usando la consulta proporcionada.
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          {migrations.map((migration) => (
            <Card key={migration.name}>
              <CardHeader>
                <CardTitle>{migration.name}</CardTitle>
                <CardDescription>{migration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{migration.sql}</code>
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => runMigration(migration)}
                  disabled={isLoading[migration.name] || success[migration.name]}
                  variant={success[migration.name] ? "outline" : "default"}
                >
                  {isLoading[migration.name] 
                    ? "Ejecutando..." 
                    : success[migration.name] 
                      ? "Completado ✓" 
                      : "Ejecutar migración"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SqlMigrations; 