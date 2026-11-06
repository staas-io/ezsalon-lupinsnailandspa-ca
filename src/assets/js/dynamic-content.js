/*
 * Live content from the booking backend.
 *
 * The pages ship the original site's static price list and footer details as a
 * fallback. When the APIs answer, the rows/fields below are replaced with the
 * live data; when they fail the static copy stays and nothing breaks.
 */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function formatPrice(cents) {
  if (typeof cents !== 'number') return '';
  return '$' + (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));
}

function formatClock(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return hhmm || '';
  const hour = parseInt(m[1], 10);
  return (hour % 12 || 12) + ':' + m[2] + ' ' + (hour < 12 ? 'am' : 'pm');
}

function formatTime(hour) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return h + ':00 ' + ampm;
}

function unwrapJson(data) {
  // Some endpoints answer { json: "<stringified JSON>" }
  if (data && data.json) {
    try {
      return typeof data.json === 'string' ? JSON.parse(data.json) : data.json;
    } catch (e) {
      // ignore, use as is
    }
  }
  return data;
}

/* ------------------------------------------------------------------ services */

function normalizeKey(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// The API returns each service twice (curated "SITE" copy and a "GAPBIZ" copy).
// Prefer the curated list; otherwise drop duplicates by name.
function pickServices(services) {
  const curated = services.filter(s => s.source === 'SITE');
  if (curated.length) return curated;
  const seen = new Set();
  return services.filter(s => {
    const key = normalizeKey(s.categoryName) + '|' + normalizeKey(s.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function serviceRowHtml(service, style) {
  const name = escapeHtml(service.name || '');
  const price = service.priceCents != null ? formatPrice(service.priceCents) : (service.price || '');
  const priceHtml = escapeHtml(price);
  if (style === 'dotted') {
    return '<div><div class="flex items-center justify-between mb-[15px]">' +
      '<span class="font-ptsans inline-block text-[16px] font-bold">' + name + '</span>' +
      '<span class="block flex-1 w-full border-dotted border-b border-[#a9a9a9] mx-[5px] mt-[10px]"></span>' +
      '<span class="font-ptsans text-[16px] font-bold">' + priceHtml + '</span></div></div>';
  }
  return '<div><div class="mb-[15px] flex items-center justify-between">' +
    '<span class="text-[16px] font-bold font-ptsans pr-[4px]">' + name + '</span>' +
    '<span class="inline-flex flex-1 w-full border-b border-[#cdcdcd] mt-[4px]"></span>' +
    '<span class="text-[16px] font-bold font-ptsans pl-[4px]">' + priceHtml + '</span></div></div>';
}

function renderServices(services) {
  if (!Array.isArray(services) || services.length === 0) return;

  const groups = new Map();
  pickServices(services).forEach(service => {
    if (service.showOnBooking === 0) return;
    const key = normalizeKey(service.categoryName);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(service);
  });

  document.querySelectorAll('[data-service-category]').forEach(block => {
    const items = groups.get(normalizeKey(block.dataset.serviceCategory));
    const rows = block.querySelector('[data-service-rows]');
    if (!items || !items.length || !rows) return; // keep the static fallback
    const style = rows.dataset.rowStyle;
    rows.innerHTML = items.map(s => serviceRowHtml(s, style)).join('');

    // an open accordion needs its height recomputed
    const panel = rows.closest('.span__transition');
    if (panel && panel.style.height && panel.style.height !== '0px') {
      panel.style.height = panel.scrollHeight + 'px';
    }
  });
}

async function loadServices() {
  const apiUrl = document.body.dataset.servicesApi;
  if (!apiUrl || !document.querySelector('[data-service-category]')) return;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to load services');
    let data = unwrapJson(await res.json());

    // Handle different response formats
    let services = [];
    if (Array.isArray(data)) {
      services = data;
    } else if (data.services && Array.isArray(data.services)) {
      services = data.services;
    } else if (data.categories && Array.isArray(data.categories)) {
      // Flatten categories
      data.categories.forEach(cat => {
        if (cat.services && Array.isArray(cat.services)) {
          cat.services.forEach(s => {
            s.categoryName = s.categoryName || cat.name;
            services.push(s);
          });
        }
      });
    }

    renderServices(services);
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

/* ------------------------------------------------------------------ contact + hours */

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function hoursLabel(h) {
  if (!h || h.closed) return 'Closed';
  return formatClock(h.open) + ' - ' + formatClock(h.close);
}

// Group consecutive days with identical hours: "Mon - Fri", "Saturday", "Sunday"
function renderHours(hoursEl, businessHours) {
  const groups = [];
  DAY_KEYS.forEach((key, idx) => {
    const h = businessHours[key];
    if (!h) return;
    const label = hoursLabel(h);
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.end === idx - 1) {
      last.end = idx;
    } else {
      groups.push({ start: idx, end: idx, label: label });
    }
  });

  let html = '';
  groups.forEach(g => {
    const day = g.start === g.end ? DAY_LONG[g.start] : DAY_SHORT[g.start] + ' - ' + DAY_SHORT[g.end];
    html += '<tr itemprop="openingHours" content="' + escapeHtml(day + ': ' + g.label) + '">' +
      '<td class="align-top block mt-[4px] mr-[12px]"><span class="text-[16px] mb-[10px] text-[#000] font-ptsans font-bold">' + escapeHtml(day) + ':</span></td>' +
      '<td class="text-[16px] mb-[10px] text-[#000] font-normal font-ptsans">' + escapeHtml(g.label) + '</td></tr>';
  });
  if (html) hoursEl.innerHTML = html;
}

async function loadContactAndHours() {
  const contactEl = document.getElementById('footer-address');
  const phoneEl = document.getElementById('footer-phone');
  const emailEl = document.getElementById('footer-email');
  const hoursEl = document.getElementById('footer-hours');

  const contactApi = document.body.dataset.contactApi || document.body.dataset.hoursApi || document.body.dataset.settingsApi;
  if (!contactApi) return;

  try {
    const res = await fetch(contactApi);
    if (!res.ok) throw new Error('Failed to load contact');
    const data = unwrapJson(await res.json());

    // Extract from settings format
    const about = data.about || {};
    const businessHours = data.businessHours || {};

    if (contactEl && about.address) {
      // "45 Hollis Ave Unit 6, Stratford, PE C1B 4A1" -> two lines like the original
      const cut = about.address.indexOf(',');
      contactEl.innerHTML = cut > -1
        ? escapeHtml(about.address.slice(0, cut + 1)) + '<br>' + escapeHtml(about.address.slice(cut + 1).trim())
        : escapeHtml(about.address);
    }
    if (phoneEl && about.phone) {
      phoneEl.textContent = about.phone;
      phoneEl.href = 'tel:' + about.phone.replace(/[^+\d]/g, '');
    }
    if (emailEl) {
      const email = about.email || data.email;
      if (email) {
        emailEl.textContent = email;
        emailEl.href = 'mailto:' + email;
      }
    }

    if (hoursEl) {
      if (Object.keys(businessHours).length) {
        renderHours(hoursEl, businessHours);
      } else if (data.hours) {
        hoursEl.innerHTML = '<tr><td class="text-[16px] mb-[10px] text-[#000] font-normal font-ptsans">' +
          escapeHtml(formatTime(data.hours.open) + ' - ' + formatTime(data.hours.close)) + '</td></tr>';
      }
    }
  } catch (err) {
    console.error('Error loading contact/hours:', err);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadServices();
  loadContactAndHours();
});
