// Dynamic content loader for services, contact info, and business hours
// Configure API endpoints here or via data attributes
const API_CONFIG = {
  services: document.body.dataset.servicesApi || null,
  contact: document.body.dataset.contactApi || null,
  hours: document.body.dataset.hoursApi || null
};

async function loadContactInfo() {
  const addressEl = document.getElementById('footer-address');
  const phoneEl = document.getElementById('footer-phone');
  const emailEl = document.getElementById('footer-email');
  
  if (!API_CONFIG.contact && !addressEl) return;
  
  try {
    if (API_CONFIG.contact) {
      const response = await fetch(API_CONFIG.contact);
      const data = await response.json();
      
      if (addressEl && data.address) {
        addressEl.innerHTML = data.address.replace(/\n/g, '<br>');
      }
      if (phoneEl && data.phone) {
        phoneEl.textContent = data.phone;
        phoneEl.href = 'tel:' + data.phone.replace(/[^+\d]/g, '');
      }
      if (emailEl && data.email) {
        emailEl.textContent = data.email;
        emailEl.href = 'mailto:' + data.email;
      }
    } else {
      // Fallback to current hardcoded values if no API configured
      if (addressEl) addressEl.innerHTML = '45 Hollis Ave Unit 6,<br>Stratford, PE C1B 4A1';
      if (phoneEl) {
        phoneEl.textContent = '902-916-8785';
        phoneEl.href = 'tel:9029168785';
      }
      if (emailEl) {
        emailEl.textContent = 'Lupinspeiholding@gmail.com';
        emailEl.href = 'mailto:Lupinspeiholding@gmail.com';
      }
    }
  } catch (error) {
    console.error('Error loading contact info:', error);
    // Use fallback
    if (addressEl) addressEl.innerHTML = '45 Hollis Ave Unit 6,<br>Stratford, PE C1B 4A1';
    if (phoneEl) {
      phoneEl.textContent = '902-916-8785';
      phoneEl.href = 'tel:9029168785';
    }
    if (emailEl) {
      emailEl.textContent = 'Lupinspeiholding@gmail.com';
      emailEl.href = 'mailto:Lupinspeiholding@gmail.com';
    }
  }
}

async function loadBusinessHours() {
  const hoursEl = document.getElementById('footer-hours');
  if (!hoursEl) return;
  
  try {
    if (API_CONFIG.hours) {
      const response = await fetch(API_CONFIG.hours);
      const data = await response.json();
      
      if (Array.isArray(data.hours)) {
        hoursEl.innerHTML = data.hours.map(h => 
          `<div><strong>${h.days}:</strong> ${h.hours}</div>`
        ).join('');
      } else if (typeof data === 'object') {
        hoursEl.innerHTML = Object.entries(data).map(([days, hours]) => 
          `<div><strong>${days}:</strong> ${hours}</div>`
        ).join('');
      }
    } else {
      // Fallback
      hoursEl.innerHTML = `
        <div><strong>Mon - Fri:</strong> 9:00 am - 8:00 pm</div>
        <div><strong>Saturday:</strong> 9:00 am - 7:00 pm</div>
        <div><strong>Sunday:</strong> Closed</div>
      `;
    }
  } catch (error) {
    console.error('Error loading business hours:', error);
    hoursEl.innerHTML = `
      <div><strong>Mon - Fri:</strong> 9:00 am - 8:00 pm</div>
      <div><strong>Saturday:</strong> 9:00 am - 7:00 pm</div>
      <div><strong>Sunday:</strong> Closed</div>
    `;
  }
}

async function loadServices() {
  const servicesEl = document.getElementById('services-list');
  if (!servicesEl) return;
  
  try {
    if (API_CONFIG.services) {
      const response = await fetch(API_CONFIG.services);
      const data = await response.json();
      
      let services = [];
      if (Array.isArray(data)) {
        services = data;
      } else if (data && Array.isArray(data.services)) {
        services = data.services;
      }
      
      if (services.length > 0) {
        servicesEl.innerHTML = services.map(service => {
          let priceText = '';
          if (service.priceCents != null) {
            const dollars = (service.priceCents / 100).toFixed(2);
            priceText = `$${dollars}`;
          } else if (service.price) {
            priceText = service.price;
          }
          return `
            <div class="service-item">
              <div class="service-item__name">${escapeHtml(service.name || '')}</div>
              ${priceText ? `<div class="service-item__price">${escapeHtml(priceText)}</div>` : ''}
              ${service.description ? `<div class="service-item__description">${escapeHtml(service.description)}</div>` : ''}
              ${service.durationMinutes ? `<div class="service-item__duration">${escapeHtml(service.durationMinutes + ' min')}</div>` : ''}
            </div>
          `;
        }).join('');
      } else {
        servicesEl.innerHTML = '<p style="text-align: center; color: #666;">No services available.</p>';
      }
    } else {
      // Fallback message or could load from static data
      servicesEl.innerHTML = '<p style="text-align: center; color: #666;">Services will be loaded from our service provider API.</p>';
    }
  } catch (error) {
    console.error('Error loading services:', error);
    servicesEl.innerHTML = '<p style="text-align: center; color: #666;">Unable to load services at this time.</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadContactInfo();
    loadBusinessHours();
    loadServices();
  });
} else {
  loadContactInfo();
  loadBusinessHours();
  loadServices();
}
