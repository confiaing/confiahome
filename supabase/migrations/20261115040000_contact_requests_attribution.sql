-- La procedencia de una consulta, con el mismo formato estricto que en la analítica (lote L9).
--
-- Las etiquetas de campaña y el sitio de procedencia llegan desde el navegador. El servidor
-- ya descarta lo que no sea una etiqueta limpia o un nombre de host; estas restricciones
-- lo repiten en la base, para que una columna «técnica» no pueda guardar texto libre.

alter table public.contact_requests
  add constraint contact_requests_utm_source_format check (utm_source ~ '^[A-Za-z0-9._~-]{1,40}$'),
  add constraint contact_requests_utm_medium_format check (utm_medium ~ '^[A-Za-z0-9._~-]{1,40}$'),
  add constraint contact_requests_utm_campaign_format check (utm_campaign ~ '^[A-Za-z0-9._~-]{1,40}$'),
  add constraint contact_requests_referrer_host_format check (referrer_host ~ '^[a-z0-9.-]+\.[a-z]{2,63}$');
