class SistemaRespaldo {
    constructor() {
        this.cargarConfiguracion();
        this.programarRespaldoAutomatico();
    }

    cargarConfiguracion() {
        this.autoBackup = localStorage.getItem('auto_backup') === 'true';
        const autoBackupCheck = document.getElementById('autoBackup');
        if (autoBackupCheck) {
            autoBackupCheck.checked = this.autoBackup;
            autoBackupCheck.addEventListener('change', (e) => {
                this.autoBackup = e.target.checked;
                localStorage.setItem('auto_backup', this.autoBackup);
                if (this.autoBackup) this.programarRespaldoAutomatico();
            });
        }
        this.actualizarEstadisticas();
    }

    programarRespaldoAutomatico() {
        if (this.intervaloBackup) clearInterval(this.intervaloBackup);
        if (this.autoBackup) {
            this.intervaloBackup = setInterval(() => {
                this.realizarRespaldo();
            }, 7 * 24 * 60 * 60 * 1000);
        }
    }

    realizarRespaldo() {
        const datos = {
            fecha: new Date().toISOString(),
            version: '2.0',
            ciclos: mantenimiento.ciclos,
            eventos: registro.eventos,
            historialMantenimiento: mantenimiento.historialMantenimiento,
            configuracion: {
                metaDiaria: localStorage.getItem('daily_goal') || '50',
                modoOscuro: localStorage.getItem('dark_mode') === 'true',
                notificaciones: {
                    push: localStorage.getItem('notif_push'),
                    sonido: localStorage.getItem('notif_sonido'),
                    email: localStorage.getItem('notif_email'),
                    emailDestino: localStorage.getItem('report_email')
                }
            }
        };
        
        localStorage.setItem('backup_automatico', JSON.stringify(datos));
        localStorage.setItem('last_backup', new Date().toISOString());
        this.actualizarEstadisticas();
        this.generarArchivoRespaldo(datos);
        
        if (typeof notificaciones !== 'undefined') {
            notificaciones.enviarNotificacion('Respaldo Completado', 'Se ha realizado un respaldo automático de tus datos', 'info');
        }
    }

    generarArchivoRespaldo(datos) {
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_porton_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    actualizarEstadisticas() {
        const lastBackup = localStorage.getItem('last_backup');
        const lastBackupSpan = document.getElementById('lastBackup');
        if (lastBackupSpan) {
            lastBackupSpan.textContent = lastBackup ? new Date(lastBackup).toLocaleString() : 'Nunca';
        }
        
        const datos = JSON.stringify(localStorage);
        const tamañoKB = Math.round(datos.length / 1024);
        const dataSizeSpan = document.getElementById('dataSize');
        if (dataSizeSpan) dataSizeSpan.textContent = `${tamañoKB} KB`;
    }

    restaurarRespaldo(archivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                
                if (datos.ciclos) {
                    mantenimiento.ciclos = datos.ciclos;
                    mantenimiento.guardarCiclos();
                }
                
                if (datos.eventos) {
                    registro.eventos = datos.eventos;
                    registro.guardarEventos();
                }
                
                if (datos.historialMantenimiento) {
                    mantenimiento.historialMantenimiento = datos.historialMantenimiento;
                    mantenimiento.guardarHistorialMantenimiento();
                }
                
                alert('✅ Respaldo restaurado correctamente');
                location.reload();
            } catch (error) {
                alert('❌ Error al restaurar el respaldo: Archivo inválido');
            }
        };
        reader.readAsText(archivo);
    }

    conectarGoogleSheets() {
        alert('Configuración de Google Sheets - Para usar esta función:\n1. Ve a console.cloud.google.com\n2. Crea un proyecto\n3. Habilita Google Sheets API\n4. Crea credenciales OAuth 2.0');
        window.open('https://console.cloud.google.com/apis/credentials', '_blank');
    }

    sincronizarSheets() {
        const datos = {
            fecha: new Date().toISOString(),
            totalCiclos: mantenimiento.ciclos.total,
            ciclosHoy: mantenimiento.obtenerCiclosHoy(),
            salud: document.getElementById('healthPercent')?.textContent,
            ultimosEventos: registro.eventos.slice(0, 10)
        };
        console.log('Sincronizando con Google Sheets:', datos);
        alert('Datos sincronizados con Google Sheets (demo)');
    }
}

function manualBackup() {
    if (typeof respaldo !== 'undefined') {
        respaldo.realizarRespaldo();
    }
}

function restoreFromBackup() {
    const fileInput = document.getElementById('restoreFile');
    if (fileInput && fileInput.files.length > 0) {
        if (confirm('¿Restaurar respaldo? Los datos actuales serán reemplazados.')) {
            if (typeof respaldo !== 'undefined') {
                respaldo.restaurarRespaldo(fileInput.files[0]);
            }
        }
    } else {
        alert('Selecciona un archivo de respaldo primero');
    }
}

function connectGoogleSheets() {
    if (typeof respaldo !== 'undefined') {
        respaldo.conectarGoogleSheets();
    }
}

function syncToSheets() {
    if (typeof respaldo !== 'undefined') {
        respaldo.sincronizarSheets();
    }
}

const respaldo = new SistemaRespaldo();
