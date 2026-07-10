export class NotificacionService {
  async enviarCorreo(email: string, asunto: string, mensaje: string) {
    console.log('\n------------------ [SERVICIOS EXTERNOS - NOTIFICACIONES] ------------------');
    console.log(`[Email Service] Simulación de Envío de Correo`);
    console.log(`Para: ${email}`);
    console.log(`Asunto: ${asunto}`);
    console.log(`Cuerpo del mensaje:\n${mensaje}`);
    console.log('---------------------------------------------------------------------------\n');
  }

  async enviarSMS(telefono: string, mensaje: string) {
    if (!telefono) return;
    console.log('\n------------------ [SERVICIOS EXTERNOS - NOTIFICACIONES] ------------------');
    console.log(`[SMS Service] Simulación de Envío de SMS`);
    console.log(`Para (Celular): ${telefono}`);
    console.log(`Mensaje: ${mensaje}`);
    console.log('---------------------------------------------------------------------------\n');
  }
}
export default NotificacionService;
