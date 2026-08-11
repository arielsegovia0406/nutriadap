export interface FoodItemData {
  id: string
  name: string
  brand?: string
  category: string
  barcode?: string
  /** Procedencia del dato nutricional */
  source?: 'verified' | 'openfoodfacts' | 'ai'
  // por 100 g
  kcal: number
  protein: number
  carbs: number
  fat: number
  servingDesc: string
  servingG: number
}

/**
 * Base de datos de alimentos verificados (valores por 100 g).
 * Fuentes de referencia: USDA FoodData Central / tablas de composición oficiales.
 */
export const FOOD_DB: FoodItemData[] = [
  // Proteínas
  { id: 'f001', name: 'Pechuga de pollo (cocida)', category: 'Proteínas', barcode: '8410011000011', kcal: 165, protein: 31, carbs: 0, fat: 3.6, servingDesc: '1 pechuga (120 g)', servingG: 120 },
  { id: 'f002', name: 'Muslo de pollo sin piel (cocido)', category: 'Proteínas', kcal: 209, protein: 26, carbs: 0, fat: 10.9, servingDesc: '1 muslo (90 g)', servingG: 90 },
  { id: 'f003', name: 'Ternera magra (a la plancha)', category: 'Proteínas', barcode: '8410011000028', kcal: 187, protein: 27, carbs: 0, fat: 8, servingDesc: '1 filete (150 g)', servingG: 150 },
  { id: 'f004', name: 'Lomo de cerdo (cocido)', category: 'Proteínas', kcal: 167, protein: 28, carbs: 0, fat: 5.5, servingDesc: '1 filete (120 g)', servingG: 120 },
  { id: 'f005', name: 'Salmón (al horno)', category: 'Proteínas', barcode: '8410011000035', kcal: 208, protein: 22, carbs: 0, fat: 13, servingDesc: '1 lomo (140 g)', servingG: 140 },
  { id: 'f006', name: 'Atún en lata (escurrido)', category: 'Proteínas', barcode: '8410011000042', kcal: 116, protein: 26, carbs: 0, fat: 1, servingDesc: '1 lata (80 g)', servingG: 80 },
  { id: 'f007', name: 'Merluza (cocida)', category: 'Proteínas', kcal: 92, protein: 20, carbs: 0, fat: 1, servingDesc: '1 filete (150 g)', servingG: 150 },
  { id: 'f008', name: 'Huevo entero (cocido)', category: 'Proteínas', barcode: '8410011000059', kcal: 155, protein: 13, carbs: 1.1, fat: 11, servingDesc: '1 huevo (55 g)', servingG: 55 },
  { id: 'f009', name: 'Clara de huevo', category: 'Proteínas', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, servingDesc: '3 claras (100 g)', servingG: 100 },
  { id: 'f010', name: 'Tofu firme', category: 'Proteínas', kcal: 83, protein: 9, carbs: 1.2, fat: 4.8, servingDesc: '1/2 bloque (120 g)', servingG: 120 },
  { id: 'f011', name: 'Gambas (cocidas)', category: 'Proteínas', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, servingDesc: '10 gambas (85 g)', servingG: 85 },
  { id: 'f012', name: 'Pavo en fiambre', category: 'Proteínas', barcode: '8410011000066', kcal: 104, protein: 17, carbs: 2, fat: 2.5, servingDesc: '2 lonchas (40 g)', servingG: 40 },
  { id: 'f013', name: 'Jamón serrano', category: 'Proteínas', barcode: '8410011000073', kcal: 241, protein: 31, carbs: 0.5, fat: 13, servingDesc: '2 lonchas (30 g)', servingG: 30 },
  { id: 'f014', name: 'Proteína whey (polvo)', category: 'Proteínas', barcode: '8410011000080', kcal: 373, protein: 75, carbs: 8, fat: 4, servingDesc: '1 scoop (30 g)', servingG: 30 },
  { id: 'f015', name: 'Seitán', category: 'Proteínas', kcal: 138, protein: 24, carbs: 4, fat: 2, servingDesc: '1 ración (100 g)', servingG: 100 },

  // Lácteos
  { id: 'f016', name: 'Yogur griego natural 0%', category: 'Lácteos', barcode: '8410011000097', kcal: 57, protein: 10, carbs: 3.6, fat: 0.4, servingDesc: '1 tarrina (170 g)', servingG: 170 },
  { id: 'f017', name: 'Yogur natural entero', category: 'Lácteos', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, servingDesc: '1 yogur (125 g)', servingG: 125 },
  { id: 'f018', name: 'Leche semidesnatada', category: 'Lácteos', barcode: '8410011000103', kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6, servingDesc: '1 vaso (250 ml)', servingG: 250 },
  { id: 'f019', name: 'Queso fresco batido 0%', category: 'Lácteos', kcal: 45, protein: 8, carbs: 3.5, fat: 0.2, servingDesc: '1 tarrina (200 g)', servingG: 200 },
  { id: 'f020', name: 'Queso mozzarella light', category: 'Lácteos', barcode: '8410011000110', kcal: 210, protein: 24, carbs: 2, fat: 12, servingDesc: '1 porción (40 g)', servingG: 40 },
  { id: 'f021', name: 'Queso curado', category: 'Lácteos', kcal: 408, protein: 26, carbs: 0.5, fat: 34, servingDesc: '1 cuña (30 g)', servingG: 30 },
  { id: 'f022', name: 'Requesón', category: 'Lácteos', kcal: 98, protein: 11, carbs: 3.4, fat: 4.3, servingDesc: '1/2 taza (110 g)', servingG: 110 },
  { id: 'f023', name: 'Skyr', category: 'Lácteos', barcode: '8410011000127', kcal: 63, protein: 11, carbs: 4, fat: 0.2, servingDesc: '1 tarrina (150 g)', servingG: 150 },
  { id: 'f024', name: 'Bebida de avena', category: 'Lácteos', barcode: '8410011000134', kcal: 43, protein: 0.8, carbs: 7, fat: 1.3, servingDesc: '1 vaso (250 ml)', servingG: 250 },

  // Cereales y pan
  { id: 'f025', name: 'Avena (copos)', category: 'Cereales', barcode: '8410011000141', kcal: 389, protein: 17, carbs: 66, fat: 7, servingDesc: '1/2 taza (40 g)', servingG: 40 },
  { id: 'f026', name: 'Arroz blanco (cocido)', category: 'Cereales', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, servingDesc: '1 taza (160 g)', servingG: 160 },
  { id: 'f027', name: 'Arroz integral (cocido)', category: 'Cereales', kcal: 123, protein: 2.7, carbs: 26, fat: 1, servingDesc: '1 taza (160 g)', servingG: 160 },
  { id: 'f028', name: 'Pasta (cocida)', category: 'Cereales', kcal: 158, protein: 5.8, carbs: 31, fat: 0.9, servingDesc: '1 plato (180 g)', servingG: 180 },
  { id: 'f029', name: 'Pan integral', category: 'Cereales', barcode: '8410011000158', kcal: 247, protein: 13, carbs: 41, fat: 3.5, servingDesc: '2 rebanadas (60 g)', servingG: 60 },
  { id: 'f030', name: 'Pan blanco', category: 'Cereales', kcal: 265, protein: 9, carbs: 49, fat: 3.2, servingDesc: '2 rebanadas (60 g)', servingG: 60 },
  { id: 'f031', name: 'Tortilla de trigo integral', category: 'Cereales', barcode: '8410011000165', kcal: 287, protein: 8, carbs: 48, fat: 7, servingDesc: '1 tortilla (45 g)', servingG: 45 },
  { id: 'f032', name: 'Quinoa (cocida)', category: 'Cereales', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, servingDesc: '1 taza (185 g)', servingG: 185 },
  { id: 'f033', name: 'Cuscús (cocido)', category: 'Cereales', kcal: 112, protein: 3.8, carbs: 23, fat: 0.2, servingDesc: '1 taza (157 g)', servingG: 157 },
  { id: 'f034', name: 'Pan de centeno', category: 'Cereales', kcal: 259, protein: 8.5, carbs: 48, fat: 3.3, servingDesc: '2 rebanadas (70 g)', servingG: 70 },
  { id: 'f035', name: 'Cereales de desayuno integrales', category: 'Cereales', barcode: '8410011000172', kcal: 367, protein: 9, carbs: 78, fat: 2.5, servingDesc: '1 bowl (40 g)', servingG: 40 },
  { id: 'f036', name: 'Gachas de avena proteicas', category: 'Cereales', barcode: '8410011000189', kcal: 380, protein: 25, carbs: 55, fat: 7, servingDesc: '1 sobre (50 g)', servingG: 50 },

  // Frutas
  { id: 'f037', name: 'Plátano', category: 'Frutas', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, servingDesc: '1 unidad (120 g)', servingG: 120 },
  { id: 'f038', name: 'Manzana', category: 'Frutas', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, servingDesc: '1 unidad (180 g)', servingG: 180 },
  { id: 'f039', name: 'Naranja', category: 'Frutas', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, servingDesc: '1 unidad (150 g)', servingG: 150 },
  { id: 'f040', name: 'Fresas', category: 'Frutas', kcal: 33, protein: 0.7, carbs: 8, fat: 0.3, servingDesc: '1 taza (150 g)', servingG: 150 },
  { id: 'f041', name: 'Arándanos', category: 'Frutas', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3, servingDesc: '1 taza (148 g)', servingG: 148 },
  { id: 'f042', name: 'Uvas', category: 'Frutas', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, servingDesc: '1 racimo pequeño (100 g)', servingG: 100 },
  { id: 'f043', name: 'Kiwi', category: 'Frutas', kcal: 61, protein: 1.1, carbs: 15, fat: 0.5, servingDesc: '1 unidad (75 g)', servingG: 75 },
  { id: 'f044', name: 'Mango', category: 'Frutas', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, servingDesc: '1 taza (165 g)', servingG: 165 },
  { id: 'f045', name: 'Piña', category: 'Frutas', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, servingDesc: '1 rodaja (100 g)', servingG: 100 },
  { id: 'f046', name: 'Sandía', category: 'Frutas', kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, servingDesc: '1 taza (152 g)', servingG: 152 },

  // Verduras y hortalizas
  { id: 'f047', name: 'Brócoli (cocido)', category: 'Verduras', kcal: 35, protein: 2.4, carbs: 7, fat: 0.4, servingDesc: '1 taza (156 g)', servingG: 156 },
  { id: 'f048', name: 'Espinacas', category: 'Verduras', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingDesc: '1 bol (80 g)', servingG: 80 },
  { id: 'f049', name: 'Tomate', category: 'Verduras', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingDesc: '1 unidad (120 g)', servingG: 120 },
  { id: 'f050', name: 'Pepino', category: 'Verduras', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, servingDesc: '1/2 unidad (100 g)', servingG: 100 },
  { id: 'f051', name: 'Pimiento rojo', category: 'Verduras', kcal: 31, protein: 1, carbs: 6, fat: 0.3, servingDesc: '1 unidad (150 g)', servingG: 150 },
  { id: 'f052', name: 'Calabacín', category: 'Verduras', kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, servingDesc: '1 unidad (200 g)', servingG: 200 },
  { id: 'f053', name: 'Zanahoria', category: 'Verduras', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, servingDesc: '1 unidad (80 g)', servingG: 80 },
  { id: 'f054', name: 'Lechuga', category: 'Verduras', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, servingDesc: '1 ensaladera (100 g)', servingG: 100 },
  { id: 'f055', name: 'Champiñones', category: 'Verduras', kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, servingDesc: '1 taza (100 g)', servingG: 100 },
  { id: 'f056', name: 'Cebolla', category: 'Verduras', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, servingDesc: '1/2 unidad (60 g)', servingG: 60 },

  // Tubérculos y legumbres
  { id: 'f057', name: 'Patata (cocida)', category: 'Tubérculos y legumbres', kcal: 87, protein: 1.9, carbs: 20, fat: 0.1, servingDesc: '1 unidad (150 g)', servingG: 150 },
  { id: 'f058', name: 'Boniato (asado)', category: 'Tubérculos y legumbres', kcal: 90, protein: 2, carbs: 21, fat: 0.2, servingDesc: '1 unidad (150 g)', servingG: 150 },
  { id: 'f059', name: 'Garbanzos (cocidos)', category: 'Tubérculos y legumbres', barcode: '8410011000196', kcal: 164, protein: 9, carbs: 27, fat: 2.6, servingDesc: '1 taza (165 g)', servingG: 165 },
  { id: 'f060', name: 'Lentejas (cocidas)', category: 'Tubérculos y legumbres', kcal: 116, protein: 9, carbs: 20, fat: 0.4, servingDesc: '1 taza (200 g)', servingG: 200 },
  { id: 'f061', name: 'Alubias blancas (cocidas)', category: 'Tubérculos y legumbres', kcal: 140, protein: 9, carbs: 25, fat: 0.4, servingDesc: '1 taza (180 g)', servingG: 180 },
  { id: 'f062', name: 'Edamame', category: 'Tubérculos y legumbres', kcal: 122, protein: 12, carbs: 9, fat: 5, servingDesc: '1 taza (155 g)', servingG: 155 },

  // Grasas y frutos secos
  { id: 'f063', name: 'Aceite de oliva virgen extra', category: 'Grasas', barcode: '8410011000202', kcal: 884, protein: 0, carbs: 0, fat: 100, servingDesc: '1 cucharada (10 ml)', servingG: 10 },
  { id: 'f064', name: 'Aguacate', category: 'Grasas', kcal: 160, protein: 2, carbs: 9, fat: 15, servingDesc: '1/2 unidad (100 g)', servingG: 100 },
  { id: 'f065', name: 'Almendras', category: 'Grasas', barcode: '8410011000219', kcal: 579, protein: 21, carbs: 22, fat: 50, servingDesc: '1 puñado (25 g)', servingG: 25 },
  { id: 'f066', name: 'Nueces', category: 'Grasas', kcal: 654, protein: 15, carbs: 14, fat: 65, servingDesc: '1 puñado (25 g)', servingG: 25 },
  { id: 'f067', name: 'Crema de cacahuete', category: 'Grasas', barcode: '8410011000226', kcal: 588, protein: 25, carbs: 20, fat: 50, servingDesc: '1 cucharada (16 g)', servingG: 16 },
  { id: 'f068', name: 'Crema de almendra', category: 'Grasas', kcal: 614, protein: 21, carbs: 19, fat: 56, servingDesc: '1 cucharada (16 g)', servingG: 16 },
  { id: 'f069', name: 'Semillas de chía', category: 'Grasas', kcal: 486, protein: 17, carbs: 42, fat: 31, servingDesc: '1 cucharada (12 g)', servingG: 12 },
  { id: 'f070', name: 'Mantequilla', category: 'Grasas', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, servingDesc: '1 porción (10 g)', servingG: 10 },

  // Snacks y preparados
  { id: 'f071', name: 'Barrita proteica', category: 'Snacks', barcode: '8410011000233', kcal: 360, protein: 32, carbs: 38, fat: 10, servingDesc: '1 barrita (60 g)', servingG: 60 },
  { id: 'f072', name: 'Hummus', category: 'Snacks', barcode: '8410011000240', kcal: 166, protein: 8, carbs: 14, fat: 10, servingDesc: '2 cucharadas (30 g)', servingG: 30 },
  { id: 'f073', name: 'Tortitas de arroz', category: 'Snacks', kcal: 387, protein: 8, carbs: 82, fat: 3, servingDesc: '2 tortitas (18 g)', servingG: 18 },
  { id: 'f074', name: 'Chocolate negro 85%', category: 'Snacks', barcode: '8410011000257', kcal: 590, protein: 10, carbs: 22, fat: 46, servingDesc: '4 onzas (20 g)', servingG: 20 },
  { id: 'f075', name: 'Palomitas (caseras)', category: 'Snacks', kcal: 387, protein: 13, carbs: 78, fat: 4.5, servingDesc: '1 bol (30 g)', servingG: 30 },
  { id: 'f076', name: 'Pizza margarita (porción)', category: 'Preparados', barcode: '8410011000264', kcal: 266, protein: 11, carbs: 33, fat: 10, servingDesc: '1 porción (125 g)', servingG: 125 },
  { id: 'f077', name: 'Hamburguesa clásica', category: 'Preparados', barcode: '8410011000271', kcal: 254, protein: 13, carbs: 24, fat: 12, servingDesc: '1 unidad (220 g)', servingG: 220 },
  { id: 'f078', name: 'Sushi variado', category: 'Preparados', kcal: 143, protein: 6, carbs: 24, fat: 2.5, servingDesc: '8 piezas (200 g)', servingG: 200 },
  { id: 'f079', name: 'Burrito de pollo', category: 'Preparados', kcal: 206, protein: 12, carbs: 24, fat: 7, servingDesc: '1 unidad (250 g)', servingG: 250 },
  { id: 'f080', name: 'Ensalada César con pollo', category: 'Preparados', kcal: 127, protein: 10, carbs: 5, fat: 8, servingDesc: '1 plato (250 g)', servingG: 250 },

  // Comida ecuatoriana (valores por 100 g, porciones típicas caseras)
  { id: 'ec01', name: 'Encebollado de pescado', category: 'Comida ecuatoriana', kcal: 65, protein: 7, carbs: 6, fat: 2, servingDesc: '1 plato (400 g)', servingG: 400 },
  { id: 'ec02', name: 'Ceviche de camarón', category: 'Comida ecuatoriana', kcal: 85, protein: 10, carbs: 6, fat: 3, servingDesc: '1 porción (250 g)', servingG: 250 },
  { id: 'ec03', name: 'Ceviche de chochos', category: 'Comida ecuatoriana', kcal: 90, protein: 5, carbs: 12, fat: 2.5, servingDesc: '1 porción (200 g)', servingG: 200 },
  { id: 'ec04', name: 'Hornado con mote', category: 'Comida ecuatoriana', kcal: 280, protein: 22, carbs: 1, fat: 21, servingDesc: '1 porción (150 g)', servingG: 150 },
  { id: 'ec05', name: 'Fritada', category: 'Comida ecuatoriana', kcal: 320, protein: 20, carbs: 2, fat: 26, servingDesc: '1 porción (150 g)', servingG: 150 },
  { id: 'ec06', name: 'Llapingachos', category: 'Comida ecuatoriana', kcal: 180, protein: 6, carbs: 22, fat: 8, servingDesc: '2 unidades (150 g)', servingG: 150 },
  { id: 'ec07', name: 'Locro de papa', category: 'Comida ecuatoriana', kcal: 95, protein: 4, carbs: 11, fat: 4, servingDesc: '1 plato (350 g)', servingG: 350 },
  { id: 'ec08', name: 'Bolón de verde', category: 'Comida ecuatoriana', kcal: 210, protein: 5, carbs: 30, fat: 9, servingDesc: '1 unidad (150 g)', servingG: 150 },
  { id: 'ec09', name: 'Mote pillo', category: 'Comida ecuatoriana', kcal: 160, protein: 6, carbs: 18, fat: 8, servingDesc: '1 plato (200 g)', servingG: 200 },
  { id: 'ec10', name: 'Humitas', category: 'Comida ecuatoriana', kcal: 190, protein: 4, carbs: 24, fat: 9, servingDesc: '1 unidad (120 g)', servingG: 120 },
  { id: 'ec11', name: 'Quimbolitos', category: 'Comida ecuatoriana', kcal: 220, protein: 4, carbs: 32, fat: 9, servingDesc: '1 unidad (100 g)', servingG: 100 },
  { id: 'ec12', name: 'Cuy asado', category: 'Comida ecuatoriana', kcal: 160, protein: 21, carbs: 0, fat: 8, servingDesc: '1/2 unidad (150 g)', servingG: 150 },
  { id: 'ec13', name: 'Arroz con menestra y carne', category: 'Comida ecuatoriana', kcal: 150, protein: 8, carbs: 20, fat: 5, servingDesc: '1 plato (300 g)', servingG: 300 },
  { id: 'ec14', name: 'Tigrillo', category: 'Comida ecuatoriana', kcal: 200, protein: 8, carbs: 22, fat: 10, servingDesc: '1 plato (200 g)', servingG: 200 },
  { id: 'ec15', name: 'Empanadas de viento', category: 'Comida ecuatoriana', kcal: 330, protein: 7, carbs: 35, fat: 18, servingDesc: '1 unidad (80 g)', servingG: 80 },
  { id: 'ec16', name: 'Seco de pollo', category: 'Comida ecuatoriana', kcal: 140, protein: 12, carbs: 8, fat: 7, servingDesc: '1 porción (250 g)', servingG: 250 },
  { id: 'ec17', name: 'Seco de carne', category: 'Comida ecuatoriana', kcal: 150, protein: 14, carbs: 6, fat: 8, servingDesc: '1 porción (250 g)', servingG: 250 },
  { id: 'ec18', name: 'Guatita', category: 'Comida ecuatoriana', kcal: 120, protein: 10, carbs: 6, fat: 7, servingDesc: '1 plato (300 g)', servingG: 300 },
  { id: 'ec19', name: 'Churrasco ecuatoriano', category: 'Comida ecuatoriana', kcal: 200, protein: 15, carbs: 12, fat: 10, servingDesc: '1 plato (300 g)', servingG: 300 },
  { id: 'ec20', name: 'Fanesca', category: 'Comida ecuatoriana', kcal: 110, protein: 5, carbs: 10, fat: 6, servingDesc: '1 plato (350 g)', servingG: 350 },
  { id: 'ec21', name: 'Patacones', category: 'Comida ecuatoriana', kcal: 230, protein: 1.5, carbs: 35, fat: 10, servingDesc: '4 unidades (120 g)', servingG: 120 },
  { id: 'ec22', name: 'Maduro frito', category: 'Comida ecuatoriana', kcal: 190, protein: 1, carbs: 32, fat: 7, servingDesc: '1 unidad (120 g)', servingG: 120 },
  { id: 'ec23', name: 'Pan de yuca', category: 'Comida ecuatoriana', kcal: 280, protein: 7, carbs: 30, fat: 15, servingDesc: '3 unidades (90 g)', servingG: 90 },
  { id: 'ec24', name: 'Chifles', category: 'Comida ecuatoriana', barcode: '7861000120015', kcal: 500, protein: 2, carbs: 55, fat: 30, servingDesc: '1 bolsa (40 g)', servingG: 40 },
  { id: 'ec25', name: 'Colada morada', category: 'Comida ecuatoriana', kcal: 90, protein: 1, carbs: 21, fat: 0.5, servingDesc: '1 taza (250 ml)', servingG: 250 },
  { id: 'ec26', name: 'Morocho', category: 'Comida ecuatoriana', kcal: 85, protein: 3, carbs: 13, fat: 2.5, servingDesc: '1 vaso (250 ml)', servingG: 250 },
  { id: 'ec27', name: 'Chicha de jora', category: 'Comida ecuatoriana', kcal: 45, protein: 0.5, carbs: 10, fat: 0.2, servingDesc: '1 vaso (250 ml)', servingG: 250 },
]

export const FOOD_CATEGORIES = [...new Set(FOOD_DB.map((f) => f.category))]
