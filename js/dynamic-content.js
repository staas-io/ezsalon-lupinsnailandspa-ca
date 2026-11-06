function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function formatPrice(cents) {
  if (typeof cents !== 'number') return '';
  return '$' + (cents / 100).toFixed(2);
}

function formatTime(hour) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return h + ':00 ' + ampm;
}

function renderServices(services) {
  const listEl = document.getElementById('services-list');
  if (!listEl) return;
  
  if (!Array.isArray(services) || services.length === 0) {
    listEl.innerHTML = '<p>No services available.</p>';
    return;
  }
  
  const hl = 'h' + (listEl.dataset.headingLevel || '3');
  let html = '';
  services.forEach(service => {
    const name = escapeHtml(service.name || '');
    const price = service.priceCents ? formatPrice(service.priceCents) : (service.price || '');
    const duration = service.durationMinutes ? service.durationMinutes + ' min' : (service.duration || '');
    html += '<div class="service-item">';
    html += '  <div class="service-item__info">';
    html += '    <' + hl + ' class="service-item__name">' + name + '</' + hl + '>';
    if (service.description) {
      html += '    <p class="service-item__desc">' + escapeHtml(service.description) + '</p>';
    }
    html += '  </div>';
    html += '  <div class="service-item__meta">';
    if (price) html += '    <span class="service-item__price">' + escapeHtml(price) + '</span>';
    if (duration) html += '    <span class="service-item__duration">' + escapeHtml(duration) + '</span>';
    html += '  </div>';
    html += '</div>';
  });
  listEl.innerHTML = html;
}

async function loadServices() {
  const apiUrl = document.body.dataset.servicesApi;
  if (!apiUrl) return;
  
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to load services');
    let data = await res.json();
    
    // Handle different response formats
    if (data.json) {
      try {
        data = typeof data.json === 'string' ? JSON.parse(data.json) : data.json;
      } catch (e) {
        // ignore
      }
    }
    
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
    let data = await res.json();
    
    // Handle wrapped JSON string format
    if (data.json) {
      try {
        data = typeof data.json === 'string' ? JSON.parse(data.json) : data.json;
      } catch (e) {
        // ignore
      }
    }
    
    // Extract from settings format
    const about = data.about || {};
    const businessHours = data.businessHours || {};
    
    if (contactEl && about.address) {
      contactEl.textContent = about.address;
    }
    if (phoneEl && about.phone) {
      phoneEl.textContent = about.phone;
      phoneEl.href = 'tel:' + about.phone.replace(/[^+\d]/g, '');
    }
    if (emailEl) {
      if (about.email) {
        emailEl.textContent = about.email;
        emailEl.href = 'mailto:' + about.email;
      } else if (data.email) {
        emailEl.textContent = data.email;
        emailEl.href = 'mailto:' + data.email;
      } else {
        // Fallback email
        emailEl.textContent = 'Lupinspeiholding@gmail.com';
        emailEl.href = 'mailto:Lupinspeiholding@gmail.com';
      }
    }
    
    if (hoursEl && businessHours) {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let html = '';
      days.forEach((day, idx) => {
        const h = businessHours[day];
        if (!h) return;
        html += '<div class="hours__row"><span>' + dayNames[idx] + '</span><span>';
        if (h.closed) {
          html += 'Closed';
        } else {
          html += h.open + ' - ' + h.close;
        }
        html += '</span></div>';
      });
      if (html) {
        hoursEl.innerHTML = html;
      } else if (data.hours) {
        hoursEl.textContent = formatTime(data.hours.open) + ' - ' + formatTime(data.hours.close);
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
