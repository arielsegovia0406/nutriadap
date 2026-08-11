import { Link } from 'react-router'
import { ArrowLeft, Flame } from 'lucide-react'

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">NutriAdapt</span>
        </div>
      </div>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </div>
      <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        Última actualización: julio de 2026 · Contacto: soporte@nutriadapt.app
      </p>
    </div>
  )
}

export function PrivacyPolicy() {
  return (
    <Shell title="Política de privacidad">
      <h2>1. Qué datos recogemos</h2>
      <p>
        <strong className="text-foreground">Datos de cuenta:</strong> nombre y email (login por email) o tu identificador de Kimi (login con Kimi).
        Nunca vendemos tus datos a terceros.
      </p>
      <p>
        <strong className="text-foreground">Datos de salud y uso:</strong> perfil corporal (edad, sexo, altura), registros de peso,
        alimentos registrados, planes nutricionales, check-ins y conversaciones con la IA. Los introduces tú voluntariamente y
        puedes borrarlos en cualquier momento desde Ajustes.
      </p>
      <p>
        <strong className="text-foreground">Datos técnicos:</strong> cookies de sesión (imprescindibles para mantener tu cuenta abierta)
        y almacenamiento local del navegador en modo invitado.
      </p>

      <h2>2. Para qué los usamos</h2>
      <p>
        Exclusivamente para prestar el servicio: calcular y ajustar tu plan nutricional, mostrar tu progreso,
        sincronizar entre tus dispositivos y responder a tus consultas de IA. No usamos tus datos con fines publicitarios.
      </p>

      <h2>3. Con quién los compartimos</h2>
      <p>
        <strong className="text-foreground">Open Food Facts:</strong> las búsquedas de alimentos y códigos de barras se consultan
        contra su API pública; no enviamos datos personales tuyos, solo el término de búsqueda o el código del producto.
      </p>
      <p>
        <strong className="text-foreground">Moonshot AI (Kimi):</strong> si usas la pestaña IA, tus mensajes y un resumen de tu plan
        se envían a su API para generar respuestas. No incluimos tu email ni identificadores de cuenta en esas llamadas.
      </p>
      <p>
        <strong className="text-foreground">Kimi (solo si entras con Kimi):</strong> recibimos tu nombre e identificador de la plataforma OAuth.
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes <strong className="text-foreground">exportar</strong> todos tus datos en JSON (Ajustes → Exportar datos),
        <strong className="text-foreground"> corregirlos</strong> editándolos en la app y
        <strong className="text-foreground"> eliminar tu cuenta</strong> por completo (Ajustes → Eliminar cuenta), lo que borra
        permanentemente tus datos de nuestros servidores en un plazo máximo de 30 días.
      </p>

      <h2>5. Conservación y seguridad</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Las contraseñas se almacenan con hash scrypt (nunca en claro),
        las sesiones usan cookies httpOnly y las comunicaciones van cifradas con HTTPS.
      </p>

      <h2>6. Menores</h2>
      <p>El servicio está dirigido a mayores de 16 años. No recogemos deliberadamente datos de menores.</p>
    </Shell>
  )
}

export function Terms() {
  return (
    <Shell title="Términos de servicio">
      <h2>1. El servicio</h2>
      <p>
        NutriAdapt es una herramienta de seguimiento nutricional y coaching adaptativo. Calcula estimaciones de gasto
        energético y planes de macronutrientes a partir de los datos que introduces.
      </p>

      <h2 id="descargo">2. Descargo médico (importante)</h2>
      <p>
        <strong className="text-foreground">NutriAdapt no es un dispositivo médico y no ofrece consejo médico.</strong>{' '}
        Las estimaciones calóricas y de macros son orientativas y pueden no ser adecuadas para ti. Consulta siempre con un
        profesional sanitario antes de hacer cambios importantes en tu dieta, especialmente en caso de embarazo, lactancia,
        trastornos de la conducta alimentaria, diabetes, enfermedad renal o cualquier condición clínica.
        Si te sientes mal, deja de seguir el plan y acude a un profesional.
      </p>

      <h2>3. Exactitud de los datos</h2>
      <p>
        Los valores nutricionales proceden de bases de referencia (USDA FoodData Central), de Open Food Facts
        (datos de etiqueta aportados por la comunidad, bajo licencia ODbL) y de estimaciones de IA.
        Pueden contener errores: verifica siempre las etiquetas de los productos.
      </p>

      <h2>4. Tu cuenta</h2>
      <p>
        Eres responsable de mantener tu contraseña segura y de la actividad de tu cuenta.
        Debes tener al menos 16 años. Podemos suspender cuentas que usen el servicio de forma abusiva o ilegal.
      </p>

      <h2>5. Propiedad y uso aceptable</h2>
      <p>
        Tu datos son tuyos: puedes exportarlos y borrarlos cuando quieras. Te comprometes a usar el servicio solo para
        fines personales y legales, sin intentar acceder a datos de otros usuarios ni sobrecargar la plataforma.
      </p>

      <h2>6. Disponibilidad y cambios</h2>
      <p>
        Hacemos lo posible por mantener el servicio disponible, pero no garantizamos un funcionamiento ininterrumpido.
        Podemos actualizar estos términos; te avisaremos de cambios relevantes dentro de la app.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, NutriAdapt no responde de daños derivados del uso de las estimaciones
        nutricionales ni de decisiones tomadas a partir de ellas. El uso es bajo tu propia responsabilidad.
      </p>
    </Shell>
  )
}
