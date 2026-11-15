import type { LegalDocument } from "./types.ts";

// Borradores con base en la Ley 1581 de 2012 (Colombia). Describen lo que el sitio hace
// hoy. Pendientes de revisión legal: ver status.ts. Si cambia el tratamiento de datos,
// cambian este texto y su versión (src/domain/contact/consent.ts).

export const privacy: LegalDocument = {
  title: "Política de privacidad",
  version: "2026-11-borrador",
  updated: "Borrador de noviembre de 2026",
  intro: [
    "Esta política explica qué datos tratamos cuando visitas este sitio o nos escribes, para qué los usamos y qué puedes pedirnos.",
  ],
  sections: [
    {
      id: "controller",
      heading: "Quién trata tus datos",
      blocks: [
        { p: "El responsable del tratamiento es {entity:name}, con identificación {entity:id} y domicilio en {entity:address}. En este sitio actúa bajo la marca Confia.ing." },
        { p: "Para cualquier asunto relacionado con tus datos, escríbenos a {email}." },
      ],
    },
    {
      id: "data",
      heading: "Qué datos tratamos",
      blocks: [
        {
          list: [
            "Lo que escribes en el formulario de consulta: nombre, empresa, correo electrónico, teléfono y mensaje. El nombre y un medio de contacto son obligatorios; lo demás es opcional.",
            "La fecha en que aceptaste esta política, la versión que aceptaste y el idioma en que nos escribiste.",
            "De dónde llegó tu visita: el sitio de procedencia y las etiquetas de campaña del enlace, si las había. Se guardan junto a tu consulta.",
            "Registros anónimos de uso de la página: qué página se vio, qué botón se pulsó, en qué idioma y en qué tipo de dispositivo. No incluyen tu dirección IP ni ningún identificador que permita reconocerte.",
            "Tu dirección IP y el tipo de navegador, que nuestros proveedores usan un instante para servir la página y frenar el envío automatizado. Nosotros no los guardamos en nuestras bases de datos.",
          ],
        },
        { p: "No pedimos datos sensibles ni datos de menores de edad, y te pedimos que no los incluyas en tu mensaje." },
        { p: "Si reservas una conversación, los datos que escribes en el calendario los recibe Calendly, que nos comunica la reserva. Este sitio no los guarda." },
      ],
    },
    {
      id: "purposes",
      heading: "Para qué los usamos",
      blocks: [
        {
          list: [
            "Responder tu consulta y contactarte por los medios que nos diste.",
            "Coordinar la conversación inicial, si la reservas.",
            "Entender, de forma agregada y anónima, cómo se usa la página para mejorarla.",
            "Proteger el formulario frente al envío automatizado.",
          ],
        },
        { p: "No usamos tus datos para enviarte comunicaciones comerciales, y no los vendemos ni los cedemos con ese fin." },
      ],
    },
    {
      id: "authorization",
      heading: "Con qué autorización",
      blocks: [
        { p: "Tratamos los datos del formulario con la autorización que das al marcar la casilla antes de enviarlo, de acuerdo con la Ley 1581 de 2012 y sus normas reglamentarias. Puedes revocarla en cualquier momento." },
        { p: "Los registros anónimos de uso no permiten identificarte, por lo que no dependen de esa autorización." },
      ],
    },
    {
      id: "retention",
      heading: "Cuánto tiempo los conservamos",
      blocks: [
        {
          list: [
            "Consultas del formulario, incluida la copia que llega a nuestro correo: hasta 24 meses desde que las recibimos, o hasta que pidas su supresión.",
            "Registros anónimos de uso: hasta 13 meses.",
          ],
        },
      ],
    },
    {
      id: "providers",
      heading: "Quién nos ayuda a prestarlo",
      blocks: [
        {
          list: [
            "Cloudflare: aloja el sitio, lo protege frente al envío automatizado, entrega a nuestro correo el aviso de cada consulta y cuenta las visitas sin cookies.",
            "Supabase: guarda las consultas del formulario y los registros anónimos de uso.",
            "Google: aloja el buzón de correo en el que recibimos el aviso de cada consulta, con los datos que escribiste.",
            "Calendly: ofrece el calendario de reservas. Solo se carga cuando pides ver los horarios.",
          ],
        },
        { p: "Cloudflare, Supabase y Google tratan los datos por encargo nuestro. Calendly lo hace bajo sus propias condiciones y su propia política de privacidad." },
      ],
    },
    {
      id: "transfers",
      heading: "Transferencias internacionales",
      blocks: [
        { p: "Estos proveedores pueden almacenar y tratar los datos en servidores ubicados fuera de Colombia. Al enviar el formulario autorizas esa transmisión para las finalidades descritas aquí." },
      ],
    },
    {
      id: "rights",
      heading: "Tus derechos",
      blocks: [
        {
          list: [
            "Conocer, actualizar y rectificar tus datos.",
            "Pedir prueba de la autorización que nos diste.",
            "Ser informado del uso que hemos dado a tus datos.",
            "Revocar la autorización y pedir la supresión de tus datos.",
            "Acceder de forma gratuita a los datos que tratamos sobre ti.",
            "Presentar una queja ante la Superintendencia de Industria y Comercio, una vez agotado el trámite ante nosotros.",
          ],
        },
        { p: "Para ejercerlos, escríbenos a {email} indicando qué solicitas y un medio para responderte. Atendemos las consultas y los reclamos en los términos que fija la ley." },
      ],
    },
    {
      id: "contact",
      heading: "Canal de atención",
      blocks: [{ p: "El canal para consultas, reclamos y solicitudes sobre tus datos es {email}." }],
    },
    {
      id: "cookies",
      heading: "Cookies y tecnologías similares",
      blocks: [
        { p: "Este sitio no usa cookies de publicidad ni de seguimiento. Lo único que guarda en tu navegador son dos preferencias de funcionamiento:" },
        {
          list: [
            "La cookie «locale», que recuerda durante un año el idioma que elegiste. Solo se crea si cambias de idioma a mano.",
            "Tu elección entre la versión completa y la versión ligera de la página, en el almacenamiento local del navegador. Permanece hasta que la cambies o borres los datos del sitio.",
          ],
        },
        { p: "Calendly y el servicio antispam de Cloudflare pueden usar sus propias cookies cuando se cargan." },
        { p: "Si tu navegador envía la señal Global Privacy Control o Do Not Track, no registramos tu uso de la página ni cargamos el contador de visitas." },
      ],
    },
    {
      id: "changes",
      heading: "Cambios en esta política",
      blocks: [{ p: "Si cambiamos la forma en que tratamos tus datos, actualizaremos este texto y su fecha. La versión que aceptaste queda registrada junto a tu consulta." }],
    },
  ],
};

export const terms: LegalDocument = {
  title: "Términos y condiciones",
  version: "2026-11-borrador",
  updated: "Borrador de noviembre de 2026",
  intro: ["Estos términos regulan el uso de este sitio. Al navegarlo o escribirnos desde él, los aceptas."],
  sections: [
    {
      id: "purpose",
      heading: "Qué es este sitio",
      blocks: [{ p: "Este sitio presenta los servicios de Confia.ing, una consultoría de transformación de IA, y ofrece dos formas de contacto: reservar una conversación inicial o enviar una consulta." }],
    },
    {
      id: "content",
      heading: "Contenido informativo",
      blocks: [
        { p: "Lo que lees aquí es información general. No es una oferta vinculante ni un consejo legal, técnico o financiero para tu caso." },
        { p: "El alcance, las condiciones y el precio de cualquier servicio se acuerdan por escrito con cada cliente." },
      ],
    },
    {
      id: "conversation",
      heading: "La conversación inicial",
      blocks: [{ p: "La conversación de 30 minutos es exploratoria, sin costo ni compromiso para ninguna de las partes. No es un diagnóstico ni incluye entregables." }],
    },
    {
      id: "intellectual-property",
      heading: "Propiedad intelectual",
      blocks: [
        { p: "La marca, el logo, los textos y el diseño de este sitio pertenecen a Confia.ing o se usan con licencia. Las tipografías se distribuyen bajo licencias abiertas." },
        { p: "Puedes citar el contenido indicando su origen. Reproducirlo con fines comerciales requiere nuestra autorización previa." },
      ],
    },
    {
      id: "third-parties",
      heading: "Servicios de terceros",
      blocks: [{ p: "El calendario de reservas es de Calendly y el alojamiento, de Cloudflare. El uso de esos servicios se rige por sus propias condiciones. No respondemos por el contenido de los sitios externos a los que enlazamos." }],
    },
    {
      id: "use",
      heading: "Uso del sitio",
      blocks: [{ p: "Te pedimos usar el sitio de buena fe: no enviar contenido automatizado o engañoso por el formulario, ni intentar acceder a sistemas o datos que no te corresponden." }],
    },
    {
      id: "liability",
      heading: "Limitación de responsabilidad",
      blocks: [
        { p: "Procuramos que la información sea correcta y que el sitio esté disponible, pero puede contener errores o dejar de estar disponible por momentos. En la medida en que la ley lo permita, no respondemos por los daños derivados del uso de la información publicada aquí." },
        { p: "Nada de lo anterior limita los derechos que la ley te reconoce como consumidor." },
      ],
    },
    {
      id: "law",
      heading: "Ley aplicable",
      blocks: [{ p: "Estos términos se rigen por las leyes de la República de Colombia." }],
    },
    {
      id: "contact",
      heading: "Contacto",
      blocks: [{ p: "Si tienes preguntas sobre estos términos, escríbenos a {email}." }],
    },
  ],
};
