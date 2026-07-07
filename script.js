// Estado de la aplicación
let carrito = [];
let ventaActual = null;
let metodoPagoSeleccionado = 'EFECTIVO';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App de Kiosco iniciada');
    
    // Cargar componentes según la página
    if (document.getElementById('productosGrid')) {
        mostrarProductos();
        configurarBuscador();
        cargarNotas();
    }
    
    if (document.getElementById('carritoItems')) {
        actualizarCarritoUI();
    }
    
    if (document.getElementById('tablaProductosBody')) {
        cargarTablaProductos();
    }
    
    if (document.getElementById('ventasHoy')) {
        cargarReportes();
    }
    
    // Verificar stock bajo al iniciar
    setTimeout(verificarStockBajo, 2000);
});

// ========== FUNCIONES DE PRODUCTOS ==========

function mostrarProductos() {
    const grid = document.getElementById('productosGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Ordenar por frecuencia de venta (los más vendidos primero)
    const productosOrdenados = [...DB.productos].sort((a, b) => b.frecuencia - a.frecuencia);
    
    productosOrdenados.forEach(producto => {
        const card = crearCardProducto(producto);
        grid.appendChild(card);
    });
}

function mostrarProductosFiltrados(productosFiltrados) {
    const grid = document.getElementById('productosGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    productosFiltrados.forEach(producto => {
        const card = crearCardProducto(producto);
        grid.appendChild(card);
    });
}

function crearCardProducto(producto) {
    const card = document.createElement('div');
    card.className = `producto-card ${producto.stock <= 0 ? 'sin-stock' : ''}`;
    
    // Icono según categoría
    let icono = '📦';
    switch(producto.categoria) {
        case 'Bebidas': icono = '🥤'; break;
        case 'Snacks': icono = '🍟'; break;
        case 'Golosinas': icono = '🍬'; break;
        case 'Cigarrillos': icono = '🚬'; break;
    }
    
    card.innerHTML = `
        <div style="font-size: 2em;">${icono}</div>
        <div style="font-weight: bold; margin: 5px 0;">${producto.nombre}</div>
        <div class="precio">$${producto.precio}</div>
        <div class="stock">📦 Stock: ${producto.stock}</div>
    `;
    
    if (producto.stock > 0) {
        card.onclick = () => agregarAlCarrito(producto);
    }
    
    return card;
}

// ========== BUSCADOR (EXTRA 1) ==========

function configurarBuscador() {
    const buscador = document.getElementById('buscador');
    if (!buscador) return;
    
    buscador.addEventListener('input', function(e) {
        const busqueda = e.target.value.toLowerCase().trim();
        const btnLimpiar = document.getElementById('btnLimpiar');
        
        if (busqueda.length > 0) {
            btnLimpiar.style.display = 'block';
            
            const productosFiltrados = DB.productos.filter(p => 
                p.nombre.toLowerCase().includes(busqueda) ||
                p.categoria.toLowerCase().includes(busqueda) ||
                (p.codigo_barras && p.codigo_barras.includes(busqueda))
            );
            
            mostrarProductosFiltrados(productosFiltrados);
            
            // Mostrar mensaje si no hay resultados
            if (productosFiltrados.length === 0) {
                document.getElementById('productosGrid').innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:40px;">
                        <div style="font-size:3em;">🔍</div>
                        <p>No se encontraron productos para "${busqueda}"</p>
                    </div>
                `;
            }
        } else {
            btnLimpiar.style.display = 'none';
            mostrarProductos();
        }
    });
    
    // Atajo de teclado: Ctrl + K para enfocar buscador
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            buscador.focus();
        }
    });
}

function limpiarBusqueda() {
    document.getElementById('buscador').value = '';
    document.getElementById('btnLimpiar').style.display = 'none';
    mostrarProductos();
    document.getElementById('buscador').focus();
}

// ========== VENTA RÁPIDA (EXTRA 2) ==========

function venderRapido(productoNombre) {
    const producto = DB.productos.find(p => 
        p.nombre.toLowerCase().includes(productoNombre.toLowerCase())
    );
    
    if (producto) {
        if (producto.stock > 0) {
            agregarAlCarrito(producto);
            
            // Feedback visual
            const btn = event.target;
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);
        } else {
            alert(`❌ ${producto.nombre} sin stock`);
        }
    }
}

// ========== CARRITO ==========

function agregarAlCarrito(producto) {
    const itemExistente = carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            mostrarNotificacion('No hay suficiente stock', 'error');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stock: producto.stock
        });
    }
    
    actualizarCarritoUI();
    mostrarNotificacion(`${producto.nombre} agregado`, 'exito');
}

function actualizarCarritoUI() {
    const carritoItems = document.getElementById('carritoItems');
    const totalSpan = document.getElementById('totalVenta');
    
    if (!carritoItems || !totalSpan) return;
    
    if (carrito.length === 0) {
        carritoItems.innerHTML = `
            <div style="text-align:center; padding:40px; color:#95a5a6;">
                <div style="font-size:3em;">🛒</div>
                <p>El carrito está vacío</p>
                <p style="font-size:0.9em;">Hacé clic en un producto para comenzar</p>
            </div>
        `;
        totalSpan.textContent = '$0';
        return;
    }
    
    carritoItems.innerHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
            <div style="flex:2;">
                <div style="font-weight:bold;">${item.nombre}</div>
                <div style="font-size:0.85em; color:#7f8c8d;">$${item.precio} c/u</div>
            </div>
            <div class="item-cantidad">
                <button onclick="modificarCantidad(${item.id}, -1)">−</button>
                <span style="min-width:30px; text-align:center;">${item.cantidad}</span>
                <button onclick="modificarCantidad(${item.id}, 1)">+</button>
                <span style="min-width:70px; text-align:right; font-weight:bold;">$${subtotal}</span>
            </div>
        `;
        
        carritoItems.appendChild(itemDiv);
    });
    
    totalSpan.textContent = `$${total}`;
}

function modificarCantidad(id, cambio) {
    const item = carrito.find(i => i.id === id);
    const producto = DB.productos.find(p => p.id === id);
    
    if (!item || !producto) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    } else if (nuevaCantidad <= producto.stock) {
        item.cantidad = nuevaCantidad;
    } else {
        mostrarNotificacion('No hay suficiente stock', 'error');
        return;
    }
    
    actualizarCarritoUI();
}

// ========== MÉTODOS DE PAGO (EXTRA 4) ==========

function seleccionarPago(metodo) {
    metodoPagoSeleccionado = metodo;
    
    // Resaltar botón seleccionado
    document.querySelectorAll('.btn-pago').forEach(btn => {
        btn.style.transform = '';
        btn.style.filter = 'brightness(1)';
    });
    
    event.target.style.transform = 'scale(0.95)';
    event.target.style.filter = 'brightness(1.1)';
    
    mostrarNotificacion(`Pago: ${getNombreMetodoPago(metodo)}`, 'info');
}

function getNombreMetodoPago(metodo) {
    const nombres = {
        'EFECTIVO': 'Efectivo',
        'TARJETA': 'Tarjeta',
        'MERCADO_PAGO': 'Mercado Pago',
        'CUENTA_DNI': 'Cuenta DNI',
        'MODE': 'MODO'
    };
    return nombres[metodo] || metodo;
}

// ========== PROCESO DE PAGO ==========

function pagar() {
    if (carrito.length === 0) {
        mostrarNotificacion('No hay productos en el carrito', 'error');
        return;
    }
    
    document.getElementById('vueltoPanel').style.display = 'block';
    
    // Auto-focus en el input de pago
    setTimeout(() => {
        document.getElementById('pagoCliente')?.focus();
    }, 300);
}

function calcularVuelto() {
    const pago = parseFloat(document.getElementById('pagoCliente').value);
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (isNaN(pago) || pago < 0) {
        alert('Ingresá un monto válido');
        return;
    }
    
    if (pago < total) {
        mostrarNotificacion('El pago es insuficiente', 'error');
        return;
    }
    
    const vuelto = pago - total;
    
    document.getElementById('resultadoVuelto').innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:1.2em; margin-bottom:10px;">Vuelto:</div>
            <div style="font-size:2.5em; font-weight:bold; color:var(--color-exito);">$${vuelto}</div>
            <button onclick="confirmarVenta()" style="
                margin-top:20px; 
                padding:15px; 
                background:var(--color-exito); 
                color:white; 
                border:none; 
                border-radius:8px; 
                width:100%; 
                font-size:1.2em;
                font-weight:bold;
                cursor:pointer;
            ">
                ✅ Confirmar Venta
            </button>
        </div>
    `;
}

function confirmarVenta() {
    // Calcular total
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    // Crear registro de venta
    const venta = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        total: total,
        metodo_pago: metodoPagoSeleccionado,
        items: [...carrito]
    };
    
    // Actualizar stock y frecuencia de productos
    carrito.forEach(item => {
        const producto = DB.productos.find(p => p.id === item.id);
        if (producto) {
            producto.stock -= item.cantidad;
            producto.frecuencia = (producto.frecuencia || 0) + item.cantidad;
        }
    });
    
    // Guardar venta
    DB.ventas.push(venta);
    DB.guardar();
    
    // Limpiar carrito
    carrito = [];
    actualizarCarritoUI();
    mostrarProductos();
    
    // Ocultar panel de vuelto
    document.getElementById('vueltoPanel').style.display = 'none';
    document.getElementById('pagoCliente').value = '';
    document.getElementById('resultadoVuelto').innerHTML = '';
    
    // Mostrar comprobante
    mostrarComprobante(venta);
    
    mostrarNotificacion('¡Venta registrada con éxito!', 'exito');
}

function mostrarComprobante(venta) {
    const comprobante = `
        🏪 KIOSCO
        ${new Date(venta.fecha).toLocaleString()}
        ${'='.repeat(20)}
        ${venta.items.map(item => 
            `${item.nombre}
             ${item.cantidad} x $${item.precio} = $${item.precio * item.cantidad}`
        ).join('\n')}
        ${'='.repeat(20)}
        TOTAL: $${venta.total}
        Pago: ${getNombreMetodoPago(venta.metodo_pago)}
        ${'='.repeat(20)}
        ¡Gracias por su compra!
    `;
    
    console.log(comprobante);
    // Opcional: mostrar en un modal
}

function cancelarVenta() {
    if (carrito.length > 0 && confirm('¿Cancelar la venta actual?')) {
        carrito = [];
        actualizarCarritoUI();
        document.getElementById('vueltoPanel').style.display = 'none';
        document.getElementById('pagoCliente').value = '';
        document.getElementById('resultadoVuelto').innerHTML = '';
        mostrarNotificacion('Venta cancelada', 'info');
    }
}

// ========== NOTAS (EXTRA 3) ==========

function toggleNotas() {
    const content = document.getElementById('notasContent');
    const btn = document.querySelector('.btn-notas');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        btn.textContent = '✖ Cerrar Notas';
        cargarNotas();
    } else {
        content.style.display = 'none';
        btn.textContent = '📝 Notas';
    }
}

function cargarNotas() {
    const notas = document.getElementById('notasTexto');
    if (notas) {
        notas.value = DB.config.notas || '';
    }
}

function guardarNotas() {
    const notas = document.getElementById('notasTexto').value;
    DB.config.notas = notas;
    DB.guardar();
    mostrarNotificacion('Notas guardadas', 'exito');
    toggleNotas();
}

// ========== ESCÁNER (EXTRA 5) ==========

function activarEscaneo() {
    alert('📷 Para implementar escáner necesitarías agregar una librería como QuaggaJS o Instascan. ¿Querés que te muestre cómo?');
    // Por ahora simulamos escaneo
    const codigo = prompt('Ingresá el código de barras manualmente:');
    if (codigo) {
        const producto = DB.productos.find(p => p.codigo_barras === codigo);
        if (producto) {
            agregarAlCarrito(producto);
        } else {
            alert('Producto no encontrado');
        }
    }
}

// ========== STOCK BAJO (EXTRA 6) ==========

function verificarStockBajo() {
    const stockBajo = DB.productos.filter(p => p.stock <= p.stock_minimo);
    
    if (stockBajo.length > 0) {
        let mensaje = "📦 *PRODUCTOS CON STOCK BAJO*\n\n";
        stockBajo.forEach(p => {
            mensaje += `• ${p.nombre}: ${p.stock} (mín: ${p.stock_minimo})\n`;
        });
        
        // Mostrar alerta visual
        const alerta = document.createElement('div');
        alerta.className = 'alerta-stock';
        alerta.innerHTML = `
            ⚠️ ${stockBajo.length} producto(s) con stock bajo 
            <button onclick="enviarWhatsAppStock()" style="margin-left:10px; padding:5px 10px;">📱 Enviar WhatsApp</button>
            <button onclick="this.parentElement.remove()" style="margin-left:5px;">✖</button>
        `;
        
        // Insertar al principio de la app
        const app = document.querySelector('.app');
        app.insertBefore(alerta, app.firstChild);
    }
}

function enviarWhatsAppStock() {
    const stockBajo = DB.productos.filter(p => p.stock <= p.stock_minimo);
    let mensaje = "📦 *PRODUCTOS CON STOCK BAJO*\n\n";
    stockBajo.forEach(p => {
        mensaje += `• ${p.nombre}: ${p.stock} unidades (mínimo: ${p.stock_minimo})\n`;
    });
    
    // Acá pondrías tu número de WhatsApp
    const url = `https://wa.me/549XXXXXXXXX?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ========== CIERRE DE CAJA (EXTRA 7) ==========

function cerrarCaja() {
    const hoy = new Date().toLocaleDateString('es-AR');
    const ventasHoy = DB.ventas.filter(v => 
        v.fecha.startsWith(new Date().toISOString().split('T')[0])
    );
    
    if (ventasHoy.length === 0) {
        if (!confirm('No hay ventas hoy. ¿Crear cierre vacío igual?')) return;
    }
    
    // Calcular por método de pago
    const resumen = {};
    let totalGeneral = 0;
    
    ventasHoy.forEach(venta => {
        const metodo = venta.metodo_pago || 'EFECTIVO';
        resumen[metodo] = (resumen[metodo] || 0) + venta.total;
        totalGeneral += venta.total;
    });
    
    const cierre = {
        fecha: new Date().toISOString().split('T')[0],
        fecha_formato: hoy,
        ventas_count: ventasHoy.length,
        resumen: resumen,
        total_general: totalGeneral
    };
    
    DB.cierresCaja.push(cierre);
    DB.guardar();
    
    // Mostrar resumen
    let mensaje = `📋 *CIERRE DE CAJA*\n📅 ${hoy}\n`;
    mensaje += `🛒 Ventas: ${ventasHoy.length}\n${'─'.repeat(20)}\n`;
    
    for (let [metodo, total] of Object.entries(resumen)) {
        mensaje += `${getNombreMetodoPago(metodo)}: $${total}\n`;
    }
    
    mensaje += `${'─'.repeat(20)}\n💰 TOTAL: $${totalGeneral}`;
    
    alert(mensaje);
    
    // Preguntar si quiere enviar por WhatsApp
    if (confirm('¿Enviar cierre por WhatsApp?')) {
        const url = `https://wa.me/549XXXXXXXXX?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    }
}

// ========== BACKUP (EXTRA 8) ==========

function hacerBackup() {
    const backup = {
        fecha: new Date().toISOString(),
        productos: DB.productos,
        ventas: DB.ventas
    };
    
    DB.backups.push(backup);
    DB.guardar();
    
    mostrarNotificacion('✅ Backup realizado', 'exito');
}

function restaurarBackup() {
    if (DB.backups.length === 0) {
        alert('No hay backups disponibles');
        return;
    }
    
    // Mostrar lista de backups
    let mensaje = 'Backups disponibles:\n\n';
    DB.backups.slice(-5).forEach((b, i) => {
        const fecha = new Date(b.fecha).toLocaleString();
        mensaje += `${i+1}. ${fecha} - ${b.ventas.length} ventas\n`;
    });
    
    const opcion = prompt(mensaje + '\nSeleccioná el número (o 0 para cancelar):');
    
    if (opcion && !isNaN(opcion) && opcion > 0 && opcion <= DB.backups.length) {
        const idx = DB.backups.length - parseInt(opcion);
        const backup = DB.backups[idx];
        
        if (confirm(`¿Restaurar backup del ${new Date(backup.fecha).toLocaleString()}?`)) {
            DB.productos = backup.productos;
            DB.ventas = backup.ventas;
            DB.guardar();
            location.reload();
        }
    }
}

// ========== GESTIÓN DE PRODUCTOS ==========

function cargarTablaProductos() {
    const tbody = document.getElementById('tablaProductosBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    DB.productos.forEach(producto => {
        const row = tbody.insertRow();
        if (producto.stock <= producto.stock_minimo) {
            row.className = 'stock-bajo';
        }
        
        row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td>${producto.stock}</td>
            <td>${producto.stock_minimo}</td>
            <td>${producto.categoria}</td>
            <td>
                <button onclick="editarProducto(${producto.id})" style="padding:5px 10px; background:#3498db; color:white; border:none; border-radius:4px; margin-right:5px;">✏️</button>
                <button onclick="eliminarProducto(${producto.id})" style="padding:5px 10px; background:#e74c3c; color:white; border:none; border-radius:4px;">🗑️</button>
            </td>
        `;
    });
}

function agregarProducto() {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const precio = parseFloat(document.getElementById('precioProducto').value);
    const stock = parseInt(document.getElementById('stockProducto').value);
    const stockMinimo = parseInt(document.getElementById('stockMinimo').value);
    const categoria = document.getElementById('categoriaProducto').value;
    
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        alert('Completá todos los campos');
        return;
    }
    
    const nuevoProducto = {
        id: DB.productos.length > 0 ? Math.max(...DB.productos.map(p => p.id)) + 1 : 1,
        nombre: nombre,
        precio: precio,
        stock: stock,
        stock_minimo: stockMinimo || 5,
        categoria: categoria,
        codigo_barras: '',
        frecuencia: 0
    };
    
    DB.productos.push(nuevoProducto);
    DB.guardar();
    
    // Limpiar formulario
    document.getElementById('nombreProducto').value = '';
    document.getElementById('precioProducto').value = '';
    document.getElementById('stockProducto').value = '';
    document.getElementById('stockMinimo').value = '5';
    
    cargarTablaProductos();
    mostrarNotificacion('✅ Producto agregado', 'exito');
}

function editarProducto(id) {
    const producto = DB.productos.find(p => p.id === id);
    if (!producto) return;
    
    const nuevoNombre = prompt('Nombre:', producto.nombre);
    if (nuevoNombre === null) return;
    
    const nuevoPrecio = parseFloat(prompt('Precio:', producto.precio));
    if (isNaN(nuevoPrecio)) return;
    
    const nuevoStock = parseInt(prompt('Stock:', producto.stock));
    if (isNaN(nuevoStock)) return;
    
    producto.nombre = nuevoNombre;
    producto.precio = nuevoPrecio;
    producto.stock = nuevoStock;
    
    DB.guardar();
    cargarTablaProductos();
    mostrarNotificacion('✅ Producto actualizado', 'exito');
}

function eliminarProducto(id) {
    if (confirm('¿Eliminar producto permanentemente?')) {
        DB.productos = DB.productos.filter(p => p.id !== id);
        DB.guardar();
        cargarTablaProductos();
        mostrarNotificacion('✅ Producto eliminado', 'exito');
    }
}

// ========== REPORTES ==========

function cargarReportes() {
    // Ventas hoy
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = DB.ventas.filter(v => v.fecha.startsWith(hoy));
    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    
    const ventasHoyEl = document.getElementById('ventasHoy');
    if (ventasHoyEl) {
        ventasHoyEl.textContent = `$${totalHoy}`;
    }
    
    // Top productos
    const frecuenciaProductos = {};
    DB.ventas.forEach(venta => {
        venta.items.forEach(item => {
            if (!frecuenciaProductos[item.nombre]) {
                frecuenciaProductos[item.nombre] = 0;
            }
            frecuenciaProductos[item.nombre] += item.cantidad;
        });
    });
    
    const topList = document.getElementById('topProductos');
    if (topList) {
        topList.innerHTML = '';
        Object.entries(frecuenciaProductos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([nombre, cantidad]) => {
                topList.innerHTML += `<li>📊 ${nombre}: ${cantidad} unidades</li>`;
            });
        
        if (Object.keys(frecuenciaProductos).length === 0) {
            topList.innerHTML = '<li style="color:#95a5a6;">Todavía no hay ventas</li>';
        }
    }
    
    // Stock bajo
    const stockBajoList = document.getElementById('stockBajo');
    if (stockBajoList) {
        const stockBajo = DB.productos.filter(p => p.stock <= p.stock_minimo);
        stockBajoList.innerHTML = '';
        
        if (stockBajo.length > 0) {
            stockBajo.forEach(p => {
                stockBajoList.innerHTML += `
                    <li style="color:#e74c3c;">
                        ⚠️ ${p.nombre} - Stock: ${p.stock} (Mín: ${p.stock_minimo})
                    </li>
                `;
            });
        } else {
            stockBajoList.innerHTML = '<li style="color:#27ae60;">✅ Todo en orden</li>';
        }
    }
    
    // Totales por método de pago
    const totalesPago = {};
    DB.ventas.forEach(venta => {
        const metodo = venta.metodo_pago || 'EFECTIVO';
        totalesPago[metodo] = (totalesPago[metodo] || 0) + venta.total;
    });
    
    const totalesPagoEl = document.getElementById('totalesPago');
    if (totalesPagoEl) {
        totalesPagoEl.innerHTML = '';
        for (let [metodo, total] of Object.entries(totalesPago)) {
            totalesPagoEl.innerHTML += `
                <li>${getNombreMetodoPago(metodo)}: $${total}</li>
            `;
        }
    }
}

// ========== NOTIFICACIONES ==========

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${tipo === 'exito' ? '#27ae60' : tipo === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 25px;
        border-radius: 50px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideUp 0.3s ease;
        font-weight: 500;
    `;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ========== EXPORTAR DATOS ==========

function exportarDatos() {
    DB.exportar();
    mostrarNotificacion('📁 Datos exportados', 'exito');
}

function importarDatos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        DB.importar(file);
    };
    
    input.click();
}

// ========== TEMAS (EXTRA 9) ==========

const TEMAS = {
    kiosco: {
        primario: '#e67e22',
        secundario: '#2c3e50',
        exito: '#27ae60',
        peligro: '#e74c3c'
    },
    noche: {
        primario: '#8e44ad',
        secundario: '#2c3e50',
        exito: '#27ae60',
        peligro: '#e74c3c'
    },
    navidad: {
        primario: '#c0392b',
        secundario: '#27ae60',
        exito: '#f39c12',
        peligro: '#e74c3c'
    }
};

function cambiarTema(tema) {
    if (!TEMAS[tema]) return;
    
    const root = document.documentElement;
    root.style.setProperty('--color-primario', TEMAS[tema].primario);
    root.style.setProperty('--color-secundario', TEMAS[tema].secundario);
    root.style.setProperty('--color-exito', TEMAS[tema].exito);
    
    DB.config.tema = tema;
    DB.guardar();
    
    mostrarNotificacion(`🎨 Tema cambiado a ${tema}`, 'exito');
}

// Cargar tema guardado
const temaGuardado = DB.config.tema || 'kiosco';
cambiarTema(temaGuardado);

// ========== ATEJOS DE TECLADO ==========

document.addEventListener('keydown', function(e) {
    // F1: Ayuda
    if (e.key === 'F1') {
        e.preventDefault();
        mostrarAyuda();
    }
    
    // Ctrl + N: Nueva venta (cancelar actual)
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        cancelarVenta();
    }
    
    // Ctrl + P: Pagar
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        pagar();
    }
    
    // Ctrl + B: Backup
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        hacerBackup();
    }
});

function mostrarAyuda() {
    alert(`
        📚 AYUDA RÁPIDA
        
        • Ctrl + K: Buscar producto
        • Ctrl + N: Nueva venta
        • Ctrl + P: Pagar
        • Ctrl + B: Backup manual
        • F1: Esta ayuda
        
        • Hacé clic en productos para agregar
        • Usá + y - para modificar cantidades
    `);
}