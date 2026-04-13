import { 
  Circle, Zap, Activity, 
  Maximize, Layers, Repeat, Target 
} from 'lucide-react';

export interface SportInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  rules: string[];
  color: string;
}

export const sportsData: Record<string, SportInfo> = {
  racquetball: {
    id: 'racquetball',
    name: 'Racquetball',
    icon: <Maximize size={48} />,
    description: 'Deporte de raqueta de alta velocidad jugado en una pista totalmente cerrada, incluyendo paredes y techo. Se caracteriza por su ritmo frenético y el uso de todas las superficies para el rebote.',
    rules: [
      'La pelota puede golpear cualquier superficie antes de tocar el suelo.',
      'El saque debe golpear la pared frontal primero.',
      'El punto se gana si el rival no devuelve la bola antes del segundo bote.',
      'Solo el jugador que saca puede anotar puntos.'
    ],
    color: '#00f2fe'
  },
  tenis: {
    id: 'tenis',
    name: 'Tenis',
    icon: <Zap size={48} />,
    description: 'Deporte olímpico de raqueta jugado por dos jugadores o parejas en una pista rectangular. El reto es enviar la pelota sobre la red evitando que el contrario logre una devolución válida.',
    rules: [
      'Se juega al mejor de 3 o 5 sets.',
      'La pelota solo puede botar una vez antes de ser devuelta.',
      'El saque se realiza en diagonal desde detrás de la línea de fondo.',
      'Puntuación clásica: 15, 30, 40 y Juego.'
    ],
    color: '#4facfe'
  },
  squash: {
    id: 'squash',
    name: 'Squash',
    icon: <Activity size={48} />,
    description: 'Deporte de interior que se juega con raquetas y una pequeña pelota de goma sobre una pista de cuatro paredes. Es conocido por su exigencia cardiovascular extrema.',
    rules: [
      'Los golpes deben realizarse siempre contra la pared frontal.',
      'Se juega a 11 puntos (debiendo ganar por diferencia de dos).',
      'Los jugadores comparten el mismo espacio de juego.',
      'La pelota no puede botar más de una vez en el suelo.'
    ],
    color: '#ff007c'
  },
  padel: {
    id: 'padel',
    name: 'Padel',
    icon: <Layers size={48} />,
    description: 'Deporte de palas que combina elementos de tenis y squash. Se juega en parejas y es famoso por su componente social y el uso estratégico de las paredes de cristal.',
    rules: [
      'El saque debe ser por debajo de la cintura.',
      'Las paredes de cristal pueden usarse para rebotar la pelota.',
      'La puntuación es igual a la del tenis.',
      'La pelota debe tocar el suelo antes de impactar en las paredes.'
    ],
    color: '#00d2ff'
  },
  pickleball: {
    id: 'pickleball',
    name: 'Pickleball',
    icon: <Target size={48} />,
    description: 'Deporte de palas en rápido crecimiento que combina tenis, bádminton y ping-pong. Se juega en una pista similar a la de bádminton con una pelota perforada.',
    rules: [
      'No se permite volear dentro de "la cocina" (zona cerca de la red).',
      'El saque es bajo y en diagonal.',
      'Solo el equipo que saca suma puntos.',
      'Se juega generalmente a 11 puntos.'
    ],
    color: '#a8ff78'
  },
  futbol: {
    id: 'futbol',
    name: 'Futbol',
    icon: <Circle size={48} />,
    description: 'El deporte rey. Dos equipos de 11 jugadores compiten por introducir un balón en la portería contraria usando cualquier parte del cuerpo excepto las manos.',
    rules: [
      'Dos tiempos de 45 minutos.',
      'Solo el portero usa las manos (dentro de su área).',
      'El fuera de juego regula la posición de los atacantes.',
      'Gana quien anote más goles.'
    ],
    color: '#11ffbd'
  },
  basquetball: {
    id: 'basquetball',
    name: 'Basquetball',
    icon: <Circle size={48} />,
    description: 'Deporte de ráfaga jugado entre dos equipos de cinco jugadores. El objetivo es encestar el balón en un aro situado a 3.05 metros de altura.',
    rules: [
      'El balón debe botarse para avanzar.',
      'Las canastas valen 1, 2 o 3 puntos.',
      'Se divide en cuatro periodos de 10 o 12 minutos.',
      'Existe un límite de faltas personales por jugador.'
    ],
    color: '#ff9a9e'
  },
  'front tenis': {
    id: 'front tenis',
    name: 'Front Tenis',
    icon: <Repeat size={48} />,
    description: 'Variante de la pelota vasca jugada en un frontón de 30 metros. Se utilizan raquetas de tenis reforzadas y una pelota de goma con gran capacidad de rebote.',
    rules: [
      'La pelota debe golpear el frontis tras el saque.',
      'Se juega principalmente en parejas.',
      'El objetivo es que el rival no logre devolver la bola al frontón.',
      'Se compite a un número determinado de tantos o tiempo.'
    ],
    color: '#f6d365'
  }
};
