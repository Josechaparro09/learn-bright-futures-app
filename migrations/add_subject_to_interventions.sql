-- Migración para agregar el campo 'subject' a la tabla interventions
-- Fecha: 2025-01-16
-- Descripción: Agrega un campo de texto para especificar la materia/asignatura de cada intervención

-- Agregar la columna 'subject' a la tabla interventions
ALTER TABLE public.interventions 
ADD COLUMN subject TEXT;

-- Agregar comentario a la columna para documentar su propósito
COMMENT ON COLUMN public.interventions.subject IS 'Materia o asignatura específica de la intervención (ej: Matemáticas, Español, Ciencias)';

-- Opcional: Actualizar el trigger updated_at si existe
-- (Esto es automático con la configuración de Supabase)
