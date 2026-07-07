// Base de datos del kiosco
const DB = {
    // Productos
    productos: [
        { 
            id: 1, 
            nombre: 'Coca-Cola 500ml', 
            precio: 80, 
            stock: 50, 
            stock_minimo: 10, 
            categoria: 'Bebidas',
            codigo_barras: '7790895001019',
            frecuencia: 0 // Para productos más vendidos
        },
        { 
            id: 2, 
            nombre: 'Papas Lays 70g', 
            precio: 120, 
            stock: 30, 
            stock_minimo: 8, 
            categoria: 'Snacks',
            codigo_barras: '7798740240103',
            frecuencia: 0
        },
        { 
            id: 3, 
            nombre: 'Alfajor Milka', 
            precio: 150, 
            stock: 20, 
            stock_minimo: 5, 
            categoria: 'Golosinas',
            codigo_barras: '7790310123456',
            frecuencia: 0
        },
        { 
            id: 4, 
            nombre: 'Agua Mineral 500ml', 
            precio: 60, 
            stock: 40, 
            stock_minimo: 12, 
            categoria: 'Bebidas',
            codigo_barras: '7791234567890',
            frecuencia: 0
        },
        { 
            id: 5, 
            nombre: 'Marlboro Box 20', 
            precio: 450, 
            stock: 25, 
            stock_minimo: 5, 
            categoria: 'Cigarrillos',
            codigo_barras: '7791350278500',
            frecuencia: 0
        }
    ],
    
    // Ventas
    ventas: [],
    
    // Detalle de ventas (para reportes detallados)
    detalle_ventas: [],

    // Configuración de la app
    config: {
        tema: 'kiosco',
        notas: '',
        ultimoBackup: null,
        metodosPago: ['EFECTIVO', 'TARJETA', 'MERCADO_PAGO', 'CUENTA_DNI', 'MODE']
    },

    // Historial de backups
    backups: [],

    // Cierres de caja
    cierresCaja: [],

    // Guardar todo en localStorage
    guardar: function() {
        localStorage.setItem('kiosco_productos', JSON.stringify(this.productos));
        localStorage.setItem('kiosco_ventas', JSON.stringify(this.ventas));
        localStorage.setItem('kiosco_detalle', JSON.stringify(this.detalle_ventas));
        localStorage.setItem('kiosco_config', JSON.stringify(this.config));
        localStorage.setItem('kiosco_backups', JSON.stringify(this.backups));
        localStorage.setItem('kiosco_cierres', JSON.stringify(this.cierresCaja));
        
        // Mostrar mensaje de guardado (opcional)
        console.log('✅ Datos guardados', new Date().toLocaleTimeString());
    },

    // Cargar de localStorage
    cargar: function() {
        try {
            const productos = localStorage.getItem('kiosco_productos');
            const ventas = localStorage.getItem('kiosco_ventas');
            const detalle = localStorage.getItem('kiosco_detalle');
            const config = localStorage.getItem('kiosco_config');
            const backups = localStorage.getItem('kiosco_backups');
            const cierres = localStorage.getItem('kiosco_cierres');
            
            if (productos) this.productos = JSON.parse(productos);
            if (ventas) this.ventas = JSON.parse(ventas);
            if (detalle) this.detalle_ventas = JSON.parse(detalle);
            if (config) this.config = JSON.parse(config);
            if (backups) this.backups = JSON.parse(backups);
            if (cierres) this.cierresCaja = JSON.parse(cierres);
            
            console.log('✅ Datos cargados correctamente');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    },

    // Resetear base de datos (útil para pruebas)
    reset: function() {
        if (confirm('¿Estás seguro? Se perderán todas las ventas y productos')) {
            localStorage.clear();
            location.reload();
        }
    },

    // Exportar datos
    exportar: function() {
        const datos = {
            productos: this.productos,
            ventas: this.ventas,
            config: this.config,
            fecha: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kiosco_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },

    // Importar datos
    importar: function(archivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                this.productos = datos.productos || this.productos;
                this.ventas = datos.ventas || this.ventas;
                this.config = datos.config || this.config;
                this.guardar();
                alert('✅ Datos importados correctamente');
                location.reload();
            } catch (error) {
                alert('❌ Error al importar archivo');
            }
        };
        reader.readAsText(archivo);
    }
};

// Inicializar
DB.cargar();

// Backup automático cada hora
setInterval(() => {
    const backup = {
        fecha: new Date().toISOString(),
        productos: DB.productos,
        ventas: DB.ventas
    };
    
    DB.backups.push(backup);
    
    // Mantener solo últimos 20 backups
    if (DB.backups.length > 20) {
        DB.backups.shift();
    }
    
    DB.guardar();
    console.log('💾 Backup automático realizado');
}, 3600000); // 1 hora