// Generador de PDF y Excel - VERSIÓN CORREGIDA CON VERIFICACIÓN
class GeneradorPDF {
    constructor() {
        console.log('📄 Inicializando GeneradorPDF...');
        this.libreriasCargadas = false;
        
        this.urlsLogos = {
            instituto: window.location.origin + '/porton-monitor-secondary/img/logo-instituto.png',
            carrera: window.location.origin + '/porton-monitor-secondary/img/logo-carrera.webp'
        };
        
        this.logosCache = {
            instituto: localStorage.getItem('logo_instituto'),
            carrera: localStorage.getItem('logo_carrera')
        };
        
        // Verificar si las librerías ya están cargadas
        this.verificarLibrerias();
    }

    verificarLibrerias() {
        if (typeof jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
            console.log('✅ Librerías jsPDF y html2canvas ya cargadas');
            this.libreriasCargadas = true;
        } else {
            console.log('⏳ Esperando carga de librerías...');
            this.cargarLibrerias();
        }
    }

    async cargarLibrerias() {
        return new Promise((resolve, reject) => {
            // Cargar jsPDF
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script1.onload = () => {
                console.log('✅ jsPDF cargado');
                // Cargar html2canvas
                const script2 = document.createElement('script');
                script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script2.onload = () => {
                    console.log('✅ html2canvas cargado');
                    this.libreriasCargadas = true;
                    resolve();
                };
                script2.onerror = (e) => {
                    console.error('❌ Error cargando html2canvas:', e);
                    reject(e);
                };
                document.head.appendChild(script2);
            };
            script1.onerror = (e) => {
                console.error('❌ Error cargando jsPDF:', e);
                reject(e);
            };
            document.head.appendChild(script1);
        });
    }

    async generarReportePDF(tipo = 'completo') {
        console.log('📑 Generando PDF tipo:', tipo);
        
        try {
            // Mostrar mensaje de carga
            this.mostrarMensajeCarga('Generando PDF, espere un momento...');
            
            // Verificar librerías
            if (!this.libreriasCargadas) {
                console.log('Cargando librerías...');
                await this.cargarLibrerias();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Verificar que jsPDF esté disponible
            if (typeof jspdf === 'undefined') {
                throw new Error('jsPDF no está disponible');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            doc.setFont('helvetica');
            await this.agregarEncabezadoConLogos(doc);
            
            switch(tipo) {
                case 'completo':
                    await this.agregarReporteCompleto(doc);
                    break;
                case 'mantenimiento':
                    await this.agregarReporteMantenimiento(doc);
                    break;
                case 'estadisticas':
                    await this.agregarReporteEstadisticas(doc);
                    break;
                default:
                    await this.agregarReporteCompleto(doc);
            }
            
            this.agregarPiePagina(doc);
            
            const fecha = new Date().toISOString().split('T')[0];
            doc.save(`reporte_porton_${fecha}.pdf`);
            
            this.mostrarMensajeExito('✅ PDF generado correctamente');
            
        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            this.mostrarMensajeError('Error al generar PDF: ' + error.message);
        }
    }

    mostrarMensajeCarga(mensaje) {
        const toast = document.createElement('div');
        toast.id = 'pdfLoadingToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        toast.innerHTML = `⏳ ${mensaje}`;
        document.body.appendChild(toast);
    }

    mostrarMensajeExito(mensaje) {
        const toast = document.getElementById('pdfLoadingToast');
        if (toast) toast.remove();
        
        const exito = document.createElement('div');
        exito.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 14px;
        `;
        exito.innerHTML = `✅ ${mensaje}`;
        document.body.appendChild(exito);
        setTimeout(() => exito.remove(), 3000);
    }

    mostrarMensajeError(mensaje) {
        const toast = document.getElementById('pdfLoadingToast');
        if (toast) toast.remove();
        
        const error = document.createElement('div');
        error.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 14px;
        `;
        error.innerHTML = `❌ ${mensaje}`;
        document.body.appendChild(error);
        setTimeout(() => error.remove(), 5000);
    }

    async cargarImagenDesdeURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (e) => {
                console.log('No se pudo cargar imagen:', url);
                reject(e);
            };
            img.src = url;
        });
    }

    async agregarEncabezadoConLogos(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoWidth = 25;
        const logoHeight = 25;
        
        // Logo izquierdo (Instituto)
        let logoInstitutoData = null;
        try {
            logoInstitutoData = await this.cargarImagenDesdeURL(this.urlsLogos.instituto);
        } catch(e) {
            console.log('Usando texto para logo instituto');
        }
        
        if (logoInstitutoData) {
            try {
                doc.addImage(logoInstitutoData, 'PNG', 15, 10, logoWidth, logoHeight);
            } catch(e) {
                this.dibujarTextoInstituto(doc, 15, 20);
            }
        } else {
            this.dibujarTextoInstituto(doc, 15, 20);
        }
        
        // Título central
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('SMARTGATE MONITOR', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Sistema Predictivo de Mantenimiento', pageWidth / 2, 28, { align: 'center' });
        doc.text('Portón Automático', pageWidth / 2, 34, { align: 'center' });
        
        // Logo derecho (Carrera)
        let logoCarreraData = null;
        try {
            logoCarreraData = await this.cargarImagenDesdeURL(this.urlsLogos.carrera);
        } catch(e) {
            console.log('Usando texto para logo carrera');
        }
        
        if (logoCarreraData) {
            try {
                doc.addImage(logoCarreraData, 'PNG', pageWidth - 40, 10, logoWidth, logoHeight);
            } catch(e) {
                this.dibujarTextoUniversidad(doc, pageWidth - 40, 20);
            }
        } else {
            this.dibujarTextoUniversidad(doc, pageWidth - 40, 20);
        }
        
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 42, pageWidth - 15, 42);
        
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Fecha: ${fechaActual}`, pageWidth - 45, 50);
        
        return 55;
    }

    dibujarTextoInstituto(doc, x, y) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Instituto Tecnológico', x, y);
        doc.text('Industrial Brasil Bolivia', x, y + 5);
    }

    dibujarTextoUniversidad(doc, x, y) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Ingeniería', x + 5, y);
        doc.text('Informática', x + 5, y + 5);
    }

    async agregarReporteCompleto(doc) {
        let yPos = 65;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('RESUMEN GENERAL', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const totalCiclos = typeof mantenimiento !== 'undefined' ? mantenimiento.ciclos.total : 0;
        const ciclosHoy = typeof mantenimiento !== 'undefined' ? mantenimiento.obtenerCiclosHoy() : 0;
        const estadoActual = document.getElementById('currentState')?.textContent || '---';
        const saludSistema = document.getElementById('healthPercent')?.textContent + '%' || '100%';
        const proximoMantenimiento = document.getElementById('nextMaintenance')?.textContent || '---';
        
        const datos = [
            ['Ciclos totales:', totalCiclos.toString()],
            ['Ciclos hoy:', ciclosHoy.toString()],
            ['Estado actual:', estadoActual],
            ['Salud del sistema:', saludSistema],
            ['Próximo mantenimiento:', proximoMantenimiento]
        ];
        
        datos.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 80, yPos);
            yPos += 7;
        });
        
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('MANTENIMIENTO PREVENTIVO', 15, yPos);
        yPos += 8;
        
        const tablaMantenimiento = [
            ['Tipo', 'Ciclos', 'Estado', 'Próximo'],
            ['Revisión Preventiva', '500', this.obtenerEstadoMantenimiento(500), `${this.obtenerCiclosRestantes(500)} ciclos`],
            ['Lubricación', '1000', this.obtenerEstadoMantenimiento(1000), `${this.obtenerCiclosRestantes(1000)} ciclos`],
            ['Revisión General', '2000', this.obtenerEstadoMantenimiento(2000), `${this.obtenerCiclosRestantes(2000)} ciclos`]
        ];
        
        this.dibujarTabla(doc, tablaMantenimiento, 15, yPos, pageWidth - 30);
        yPos += 45;
        
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            await this.agregarEncabezadoConLogos(doc);
            yPos = 55;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('ESTADÍSTICAS DE USO', 15, yPos);
        yPos += 8;
        
        let ciclosPorDia = [];
        if (typeof mantenimiento !== 'undefined') {
            ciclosPorDia = mantenimiento.obtenerCiclosPorDia(7);
        }
        
        doc.setFontSize(9);
        doc.text('Ciclos por día (últimos 7 días):', 15, yPos);
        yPos += 5;
        
        if (ciclosPorDia.length === 0) {
            doc.text('No hay datos disponibles', 20, yPos);
            yPos += 5;
        } else {
            ciclosPorDia.forEach(([fecha, cantidad]) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                    this.agregarEncabezadoConLogos(doc);
                    yPos = 50;
                }
                doc.text(`${fecha.substring(5)}: ${cantidad} ciclos`, 20, yPos);
                yPos += 5;
            });
        }
        
        yPos += 5;
        
        let horasActivas = [];
        if (typeof mantenimiento !== 'undefined') {
            horasActivas = mantenimiento.obtenerCiclosPorHora();
        }
        
        const horasTop = horasActivas
            .map((cantidad, hora) => ({ hora, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
        
        doc.text('Horas de mayor actividad:', 15, yPos);
        yPos += 5;
        
        if (horasTop.length === 0 || horasTop[0].cantidad === 0) {
            doc.text('No hay datos de actividad disponibles', 20, yPos);
        } else {
            horasTop.forEach(({ hora, cantidad }) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                    this.agregarEncabezadoConLogos(doc);
                    yPos = 50;
                }
                doc.text(`${hora}:00 - ${hora + 1}:00: ${cantidad} ciclos`, 20, yPos);
                yPos += 5;
            });
        }
    }

    async agregarReporteMantenimiento(doc) {
        let yPos = 65;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('HISTORIAL DE MANTENIMIENTO', 15, yPos);
        yPos += 8;
        
        let historialMantenimiento = [];
        if (typeof mantenimiento !== 'undefined') {
            historialMantenimiento = mantenimiento.historialMantenimiento || [];
        }
        
        if (historialMantenimiento.length === 0) {
            doc.text('No hay registros de mantenimiento previos', 20, yPos);
        } else {
            const tablaMantenimientos = [
                ['Fecha', 'Tipo', 'Ciclos al momento']
            ];
            
            historialMantenimiento.slice(-10).forEach(m => {
                tablaMantenimientos.push([
                    new Date(m.fecha).toLocaleDateString(),
                    m.tipo,
                    m.totalCiclos.toString()
                ]);
            });
            
            this.dibujarTabla(doc, tablaMantenimientos, 15, yPos, 180);
            yPos += 10 + (tablaMantenimientos.length * 7);
        }
        
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            await this.agregarEncabezadoConLogos(doc);
            yPos = 55;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMENDACIONES', 15, yPos);
        yPos += 8;
        
        const recomendaciones = [
            '• Realizar inspección visual mensual del mecanismo',
            '• Verificar el correcto funcionamiento de las fotocélulas',
            '• Mantener limpias las guías del portón',
            '• Revisar conexiones eléctricas cada 3 meses',
            '• Programar mantenimiento profesional anual'
        ];
        
        recomendaciones.forEach(rec => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
                this.agregarEncabezadoConLogos(doc);
                yPos = 50;
            }
            doc.setFontSize(9);
            doc.text(rec, 20, yPos);
            yPos += 6;
        });
    }

    async agregarReporteEstadisticas(doc) {
        let yPos = 65;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('ANÁLISIS DE TENDENCIAS', 15, yPos);
        yPos += 8;
        
        const totalCiclos = typeof mantenimiento !== 'undefined' ? mantenimiento.ciclos.total : 0;
        const proyeccion = Math.round(totalCiclos * 1.1);
        
        doc.setFontSize(10);
        doc.text(`Ciclos actuales: ${totalCiclos}`, 20, yPos);
        yPos += 6;
        doc.text(`Proyección próximo mes: ${proyeccion} ciclos`, 20, yPos);
        yPos += 6;
        
        const vidaUtil = 5000;
        const porcentajeVida = (totalCiclos / vidaUtil * 100).toFixed(1);
        doc.text(`Vida útil consumida: ${porcentajeVida}%`, 20, yPos);
        yPos += 6;
        
        const vidaRestante = vidaUtil - totalCiclos;
        doc.text(`Ciclos restantes estimados: ${vidaRestante}`, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        
        if (totalCiclos > 4000) {
            doc.setTextColor(220, 38, 38);
            doc.text('⚠️ ALERTA: Se recomienda reemplazo preventivo del motor', 20, yPos);
        } else if (totalCiclos > 3000) {
            doc.setTextColor(245, 158, 11);
            doc.text('⚠️ Atención: Desgaste significativo detectado', 20, yPos);
        } else if (totalCiclos > 2000) {
            doc.setTextColor(59, 130, 246);
            doc.text('ℹ️ Mantenimiento regular requerido', 20, yPos);
        } else {
            doc.setTextColor(16, 185, 129);
            doc.text('✅ Sistema en excelente estado', 20, yPos);
        }
    }

    agregarPiePagina(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Instituto Tecnológico Industrial Brasil Bolivia - Ingeniería Informática | Página ${i} de ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }
    }

    dibujarTabla(doc, datos, x, y, width) {
        const colWidth = width / datos[0].length;
        let yPos = y;
        
        doc.setFillColor(0, 51, 102);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        
        datos[0].forEach((header, i) => {
            doc.rect(x + (i * colWidth), yPos, colWidth, 8, 'F');
            doc.text(header, x + (i * colWidth) + 2, yPos + 5);
        });
        
        yPos += 8;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        for (let i = 1; i < datos.length; i++) {
            if (i % 2 === 0) {
                doc.setFillColor(240, 240, 240);
                doc.rect(x, yPos, width, 7, 'F');
            }
            
            datos[i].forEach((cell, j) => {
                doc.text(cell.toString(), x + (j * colWidth) + 2, yPos + 5);
            });
            yPos += 7;
        }
    }

    obtenerEstadoMantenimiento(limite) {
        if (typeof mantenimiento === 'undefined') return 'Sin datos';
        const total = mantenimiento.ciclos.total;
        const completados = Math.floor(total / limite);
        if (completados === 0) return 'Pendiente';
        if (total % limite === 0 && total > 0) return 'Completado';
        return 'En progreso';
    }

    obtenerCiclosRestantes(limite) {
        if (typeof mantenimiento === 'undefined') return 0;
        const total = mantenimiento.ciclos.total;
        const siguiente = Math.ceil(total / limite) * limite;
        return siguiente - total;
    }

    formatearDetallesExcel(datos) {
        const detalles = [];
        if (datos.modoAuto !== undefined) detalles.push(`Auto:${datos.modoAuto}`);
        if (datos.emergenciaActiva) detalles.push('Emergencia');
        if (datos.permisoEspecial) detalles.push('Permiso Especial');
        if (datos.horarioActivo) detalles.push('Modo Horario');
        if (datos.abierto === true) detalles.push('Sensor ABIERTO');
        if (datos.cerrado === true) detalles.push('Sensor CERRADO');
        if (datos.fotoHabilitado === true) detalles.push('Fotocélula OK');
        if (datos.botonFisicoHabilitado === true) detalles.push('Botón Físico OK');
        return detalles.join(' | ') || 'Sin detalles';
    }

    async cargarSheetJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async exportarExcelCompleto() {
        try {
            this.mostrarMensajeCarga('Generando Excel, espere...');
            
            if (typeof XLSX === 'undefined') {
                await this.cargarSheetJS();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const wb = XLSX.utils.book_new();
            
            const totalCiclos = typeof mantenimiento !== 'undefined' ? mantenimiento.ciclos.total : 0;
            const ciclosHoy = typeof mantenimiento !== 'undefined' ? mantenimiento.obtenerCiclosHoy() : 0;
            const estadoActual = document.getElementById('currentState')?.textContent || '---';
            const saludSistema = document.getElementById('healthPercent')?.textContent + '%' || '100%';
            
            const resumenData = [
                ['SMARTGATE MONITOR - REPORTE COMPLETO'],
                ['Instituto Tecnológico Industrial Brasil Bolivia - Ingeniería Informática'],
                ['Fecha:', new Date().toLocaleString()],
                [''],
                ['RESUMEN GENERAL'],
                ['Ciclos Totales', totalCiclos],
                ['Ciclos Hoy', ciclosHoy],
                ['Estado Actual', estadoActual],
                ['Salud del Sistema', saludSistema],
                [''],
                ['MANTENIMIENTO'],
                ['Tipo', 'Ciclo Requerido', 'Estado', 'Ciclos Restantes'],
                ['Revisión Preventiva', '500', this.obtenerEstadoMantenimiento(500), this.obtenerCiclosRestantes(500)],
                ['Lubricación', '1000', this.obtenerEstadoMantenimiento(1000), this.obtenerCiclosRestantes(1000)],
                ['Revisión General', '2000', this.obtenerEstadoMantenimiento(2000), this.obtenerCiclosRestantes(2000)]
            ];
            
            const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
            wsResumen['!cols'] = [{wch:25}, {wch:15}];
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
            
            const ciclosData = [['Fecha', 'Ciclos']];
            if (typeof mantenimiento !== 'undefined') {
                const ciclosPorDia = mantenimiento.obtenerCiclosPorDia(30);
                ciclosPorDia.forEach(([fecha, cantidad]) => {
                    ciclosData.push([fecha, cantidad]);
                });
            }
            
            const wsCiclos = XLSX.utils.aoa_to_sheet(ciclosData);
            wsCiclos['!cols'] = [{wch:15}, {wch:10}];
            XLSX.utils.book_append_sheet(wb, wsCiclos, 'Ciclos por Día');
            
            const eventosData = [['Fecha', 'Tipo', 'Evento', 'Detalles']];
            if (typeof registro !== 'undefined' && registro.eventos) {
                registro.eventos.slice(0, 500).forEach(evento => {
                    eventosData.push([
                        new Date(evento.timestamp).toLocaleString(),
                        evento.tipo,
                        evento.datos.estado || evento.datos.abierto || '-',
                        this.formatearDetallesExcel(evento.datos)
                    ]);
                });
            }
            
            const wsEventos = XLSX.utils.aoa_to_sheet(eventosData);
            wsEventos['!cols'] = [{wch:20}, {wch:12}, {wch:15}, {wch:30}];
            XLSX.utils.book_append_sheet(wb, wsEventos, 'Eventos');
            
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `reporte_porton_${fecha}.xlsx`);
            
            this.mostrarMensajeExito('✅ Excel exportado correctamente');
            
        } catch (error) {
            console.error('Error exportando Excel:', error);
            this.mostrarMensajeError('Error al exportar a Excel: ' + error.message);
        }
    }
}

const generadorPDF = new GeneradorPDF();

function generarPDFCompleto() {
    generadorPDF.generarReportePDF('completo');
}

function generarPDFMantenimiento() {
    generadorPDF.generarReportePDF('mantenimiento');
}

function generarPDFEstadisticas() {
    generadorPDF.generarReportePDF('estadisticas');
}

function exportarExcelCompleto() {
    generadorPDF.exportarExcelCompleto();
}
