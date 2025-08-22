
export interface Barrier {
  id: string;
  name: string;
  description: string;
}

export interface LearningStyle {
  id: string;
  name: string;
  description: string;
}

export interface ActivityStep {
  id: string;
  description: string;
  durationMin: number;
  durationMax: number;
  durationUnit: 'minutos' | 'horas';
}

export interface ActivityDevelopment {
  description: string;
  steps: ActivityStep[];
}

export interface Activity {
  id: string;
  name: string;
  objective: string;
  materials: string[];
  learningStyles: string[];
  barriers: string[];
  subject_id?: string; // Agregar campo para área
  development: ActivityDevelopment;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
}

export interface Intervention {
  id: string;
  teacherName: string;
  student: Student;
  activity: string;
  barriers: string[];
  learningStyles: string[];
  observations: string;
  date: Date;
}

// Datos de ejemplo
export const barriers: Barrier[] = [
  {
    id: "1",
    name: "Dificultad en el cálculo",
    description: "Problemas para realizar operaciones matemáticas básicas y aplicarlas en situaciones cotidianas"
  },
  {
    id: "2",
    name: "Dificultad en la lectura",
    description: "Problemas para decodificar texto escrito y comprender su significado"
  },
  {
    id: "3",
    name: "Dificultad en la escritura",
    description: "Problemas para expresar ideas de forma escrita con coherencia y corrección"
  },
  {
    id: "4",
    name: "Déficit de atención",
    description: "Dificultad para mantener la concentración en tareas específicas por periodos prolongados"
  }
];

export const learningStyles: LearningStyle[] = [
  {
    id: "1",
    name: "Visual",
    description: "Aprenden mejor a través de imágenes, gráficos y representaciones visuales"
  },
  {
    id: "2",
    name: "Auditivo",
    description: "Aprenden mejor escuchando explicaciones y a través del diálogo"
  },
  {
    id: "3",
    name: "Kinestésico",
    description: "Aprenden mejor a través de la experiencia práctica y la manipulación de objetos"
  },
  {
    id: "4",
    name: "Lector/Escritor",
    description: "Aprenden mejor a través de la lectura y escritura de información"
  }
];

export const activities: Activity[] = [
  {
    id: "1",
    name: "Aritmética en la Vida Real",
    objective: "Aplicar el cálculo a situaciones cotidianas para mejorar su comprensión",
    materials: ["Recibos", "Dinero didáctico", "Calculadora", "Dispositivos móviles"],
    learningStyles: ["1", "3"], // Visual, Kinestésico
    barriers: ["1"], // Dificultad en el cálculo
    development: {
      description: "Esta actividad busca contextualizar las operaciones aritméticas en situaciones de la vida real para facilitar su comprensión y aplicación práctica.",
      steps: [
        {
          id: "1",
          description: "Introducción a la importancia del cálculo en la vida diaria mediante ejemplos concretos",
          durationMin: 15,
          durationMax: 20,
          durationUnit: "minutos"
        },
        {
          id: "2",
          description: "Planteamiento de problemas reales como realizar presupuestos personales y dividir cuentas en grupo",
          durationMin: 25,
          durationMax: 30,
          durationUnit: "minutos"
        },
        {
          id: "3",
          description: "Resolución de ejercicios utilizando herramientas manuales y digitales",
          durationMin: 40,
          durationMax: 50,
          durationUnit: "minutos"
        }
      ]
    }
  },
  {
    id: "2",
    name: "Mapas Conceptuales Interactivos",
    objective: "Mejorar la comprensión lectora a través de representaciones gráficas",
    materials: ["Papel grande", "Marcadores de colores", "Aplicación de mapas mentales", "Textos adaptados"],
    learningStyles: ["1", "4"], // Visual, Lector/Escritor
    barriers: ["2"], // Dificultad en la lectura
    development: {
      description: "Esta actividad utiliza mapas conceptuales para organizar visualmente la información de textos, facilitando la comprensión y retención.",
      steps: [
        {
          id: "1",
          description: "Enseñanza de la estructura básica de un mapa conceptual con ejemplos sencillos",
          durationMin: 20,
          durationMax: 30,
          durationUnit: "minutos"
        },
        {
          id: "2",
          description: "Lectura guiada de un texto corto identificando ideas principales y secundarias",
          durationMin: 15,
          durationMax: 20,
          durationUnit: "minutos"
        },
        {
          id: "3",
          description: "Creación colaborativa de un mapa conceptual basado en el texto leído",
          durationMin: 30,
          durationMax: 40,
          durationUnit: "minutos"
        },
        {
          id: "4",
          description: "Presentación y explicación del mapa conceptual creado",
          durationMin: 15,
          durationMax: 20,
          durationUnit: "minutos"
        }
      ]
    }
  }
];

export const students: Student[] = [
  {
    id: "1",
    name: "Carlos Martínez",
    grade: "4° Primaria"
  },
  {
    id: "2",
    name: "Laura Sánchez",
    grade: "3° Primaria"
  },
  {
    id: "3",
    name: "Miguel Rodríguez",
    grade: "6° Primaria"
  }
];

export const interventions: Intervention[] = [
  {
    id: "1",
    teacherName: "Ana González",
    student: students[0],
    activity: "1",
    barriers: ["1"],
    learningStyles: ["1", "3"],
    observations: "El estudiante mostró interés durante la actividad y logró realizar cálculos sencillos con apoyo visual. Se recomienda continuar con ejercicios prácticos.",
    date: new Date("2023-03-15")
  },
  {
    id: "2",
    teacherName: "Pedro Ramírez",
    student: students[1],
    activity: "2",
    barriers: ["2"],
    learningStyles: ["1", "4"],
    observations: "La estudiante participó activamente en la creación del mapa conceptual. Ha mejorado su comprensión de las relaciones entre ideas principales y secundarias.",
    date: new Date("2023-04-02")
  }
];
