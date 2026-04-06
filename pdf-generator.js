// Generador de PDF profesional
class GeneradorPDF {
    constructor() {
        this.logos = {
            instituto: null,
            carrera: null
        };
        this.cargarLogos();
    }

    async cargarLogos() {
        // Intentar cargar los logos desde URLs locales o externas
        const logoInstituto = document.getElementById('logoInstituto');
        const logoCarrera = document.getElementById('logoCarrera');
        
        if (logoInstituto) this.logos.instituto = logoInstituto.src;
        if (logoCarrera) this.logos.carrera = logoCarrera.src;
    }

    async generarReportePDF(tipo = 'completo') {
        try {
            // Cargar librería jsPDF
            if (typeof jspdf === 'undefined') {
                await this.cargarJsPDF();
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configurar fuentes
            doc.setFont('helvetica');
            
            // === ENCABEZADO CON LOGOS ===
            await this.agregarEncabezadoConLogos(doc);
            
            // === CONTENIDO SEGÚN TIPO ===
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
            
            // === PIE DE PÁGINA ===
            this.agregarPiePagina(doc);
            
            // Guardar PDF
            const fecha = new Date().toISOString().split('T')[0];
            doc.save(`reporte_porton_${fecha}.pdf`);
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar PDF. Asegúrate de tener conexión a internet.');
        }
    }

    async agregarEncabezadoConLogos(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoWidth = 30;
        const logoHeight = 30;
        
        // Logo izquierdo (Instituto)
        try {
            const imgInstituto = await this.cargarImagenBase64(this.logos.instituto || 'https://www.itibb.edu.bo/_astro/inf.BYqDzbDZ_2nvtHD.webp');
            if (imgInstituto) {
                doc.addImage(imgInstituto, 'PNG', 15, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            // Si no carga la imagen, usar texto
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('INSTITUTO TECNOLÓGICO', 15, 25);
            doc.text('INDUSTRIAL', 15, 32);
        }
        
        // Título central
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('SMARTGATE MONITOR', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Sistema Predictivo de Mantenimiento', pageWidth / 2, 30, { align: 'center' });
        doc.text('Portón Automático', pageWidth / 2, 37, { align: 'center' });
        
        // Logo derecho (Carrera)
        try {
            const imgCarrera = await this.cargarImagenBase64(this.logos.carrera || 'https://lh3.googleusercontent.com/sitesv/APaQ0SS5XyO6UNzyX3q0mVofvPomom7yjPyyoTYEZ4ByKJJ7YZuMbtFFf5eWbyNEORi7Sj71TbdhNLQF0Kkxdm1lG-gl-NXh4MqD-LpBO7yxkcArE_XrRJ0y7ZlwPenyh1ldSxP0WNaE7ZOBQR3rpWf8vN2AtPkpz9thRvQ=w1280');
            if (imgCarrera) {
                doc.addImage(imgCarrera, 'PNG', pageWidth - 45, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Ingeniería', pageWidth - 40, 25);
            doc.text('Informática', pageWidth - 40, 32);
        }
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 45, pageWidth - 15, 45);
        
        // Fecha del reporte
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Fecha de emisión: ${fechaActual}`, pageWidth - 50, 52);
        
        return 55; // Y position después del encabezado
    }

    async agregarReporteCompleto(doc) {
        let yPos = 65;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Resumen General
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('RESUMEN GENERAL', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Datos principales
        const datos = [
            ['Ciclos totales:', mantenimiento.ciclos.total.toString()],
            ['Ciclos hoy:', mantenimiento.obtenerCiclosHoy().toString()],
            ['Estado actual:', document.getElementById('currentState')?.textContent || '---'],
            ['Salud del sistema:', document.getElementById('healthPercent')?.textContent + '%' || '100%'],
            ['Próximo mantenimiento:', document.getElementById('nextMaintenance')?.textContent || '---']
        ];
        
        datos.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 80, yPos);
            yPos += 7;
        });
        
        yPos += 5;
        
        // Tabla de mantenimiento
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('MANTENIMIENTO PREVENTIVO', 15, yPos);
        yPos += 8;
        
        // Crear tabla
        const tablaMantenimiento = [
            ['Tipo', 'Ciclos', 'Estado', 'Próximo'],
            ['Revisión Preventiva', '500', this.obtenerEstadoMantenimiento(500), `${this.obtenerCiclosRestantes(500)} ciclos`],
            ['Lubricación', '1000', this.obtenerEstadoMantenimiento(1000), `${this.obtenerCiclosRestantes(1000)} ciclos`],
            ['Revisión General', '2000', this.obtenerEstadoMantenimiento(2000), `${this.obtenerCiclosRestantes(2000)} ciclos`]
        ];
        
        this.dibujarTabla(doc, tablaMantenimiento, 15, yPos, pageWidth - 30);
        yPos += 50;
        
        // Verificar si necesitamos nueva página
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            this.agregarEncabezadoConLogos(doc);
        }
        
        // Estadísticas de ciclos
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('ESTADÍSTICAS DE USO', 15, yPos);
        yPos += 8;
        
        const ciclosPorDia = mantenimiento.obtenerCiclosPorDia(7);
        doc.setFontSize(9);
        doc.text('Ciclos por día (últimos 7 días):', 15, yPos);
        yPos += 5;
        
        ciclosPorDia.forEach(([fecha, cantidad]) => {
            doc.text(`${fecha.substring(5)}: ${cantidad} ciclos`, 20, yPos);
            yPos += 5;
        });
        
        yPos += 5;
        
        // Horas más activas
        const horasActivas = mantenimiento.obtenerCiclosPorHora();
        const horasTop = horasActivas
            .map((cantidad, hora) => ({ hora, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
        
        doc.text('Horas de mayor actividad:', 15, yPos);
        yPos += 5;
        horasTop.forEach(({ hora, cantidad }) => {
            doc.text(`${hora}:00 - ${hora + 1}:00: ${cantidad} ciclos`, 20, yPos);
            yPos += 5;
        });
    }

    async agregarReporteMantenimiento(doc) {
        let yPos = 65;
        
        // Historial de mantenimientos
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('HISTORIAL DE MANTENIMIENTO', 15, yPos);
        yPos += 8;
        
        if (mantenimiento.historialMantenimiento.length === 0) {
            doc.text('No hay registros de mantenimiento previos', 20, yPos);
        } else {
            const tablaMantenimientos = [
                ['Fecha', 'Tipo', 'Ciclos al momento']
            ];
            
            mantenimiento.historialMantenimiento.slice(-10).forEach(m => {
                tablaMantenimientos.push([
                    new Date(m.fecha).toLocaleDateString(),
                    m.tipo,
                    m.totalCiclos.toString()
                ]);
            });
            
            this.dibujarTabla(doc, tablaMantenimientos, 15, yPos, 180);
            yPos += 10 + (tablaMantenimientos.length * 7);
        }
        
        // Recomendaciones
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            this.agregarEncabezadoConLogos(doc);
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
            doc.setFontSize(9);
            doc.text(rec, 20, yPos);
            yPos += 6;
        });
    }

    async agregarReporteEstadisticas(doc) {
        let yPos = 65;
        
        // Gráfico de tendencia (textual)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('ANÁLISIS DE TENDENCIAS', 15, yPos);
        yPos += 8;
        
        const totalCiclos = mantenimiento.ciclos.total;
        const proyeccion = Math.round(totalCiclos * 1.1); // Proyección 10% más
        
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
        
        // Alerta de mantenimiento predictivo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        
        if (totalCiclos > 4000) {
            doc.text('⚠️ ALERTA: Se recomienda reemplazo preventivo del motor', 20, yPos);
        } else if (totalCiclos > 3000) {
            doc.text('⚠️ Atención: Desgaste significativo detectado', 20, yPos);
        } else if (totalCiclos > 2000) {
            doc.text('ℹ️ Mantenimiento regular requerido', 20, yPos);
        } else {
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
        
        // Cabecera
        doc.setFillColor(0, 51, 102);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        
        datos[0].forEach((header, i) => {
            doc.rect(x + (i * colWidth), yPos, colWidth, 8, 'F');
            doc.text(header, x + (i * colWidth) + 2, yPos + 5);
        });
        
        yPos += 8;
        
        // Filas
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        for (let i = 1; i < datos.length; i++) {
            // Color alternado para filas
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
        const total = mantenimiento.ciclos.total;
        const completados = Math.floor(total / limite);
        if (completados === 0) return 'Pendiente';
        if (total % limite === 0 && total > 0) return 'Completado';
        return 'En progreso';
    }

    obtenerCiclosRestantes(limite) {
        const total = mantenimiento.ciclos.total;
        const siguiente = Math.ceil(total / limite) * limite;
        return siguiente - total;
    }

    async cargarJsPDF() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // También cargar html2canvas para imágenes
                const canvasScript = document.createElement('script');
                canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                canvasScript.onload = resolve;
                canvasScript.onerror = reject;
                document.head.appendChild(canvasScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
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

    async cargarImagenBase64(url) {
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
            img.onerror = reject;
            img.src = url;
        });
    }

    // Exportar a Excel con formato profesional
    async exportarExcelCompleto() {
        try {
            if (typeof XLSX === 'undefined') {
                await this.cargarSheetJS();
            }
            
            const wb = XLSX.utils.book_new();
            
            // Hoja 1: Resumen
            const resumenData = [
                ['SMARTGATE MONITOR - REPORTE COMPLETO'],
                ['Instituto Tecnológico Industrial Brasil Bolivia - Ingeniería Informática'],
                ['Fecha:', new Date().toLocaleString()],
                [''],
                ['RESUMEN GENERAL'],
                ['Ciclos Totales', mantenimiento.ciclos.total],
                ['Ciclos Hoy', mantenimiento.obtenerCiclosHoy()],
                ['Estado Actual', document.getElementById('currentState')?.textContent || '---'],
                ['Salud del Sistema', document.getElementById('healthPercent')?.textContent + '%' || '100%'],
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
            
            // Hoja 2: Ciclos por día
            const ciclosData = [['Fecha', 'Ciclos']];
            const ciclosPorDia = mantenimiento.obtenerCiclosPorDia(30);
            ciclosPorDia.forEach(([fecha, cantidad]) => {
                ciclosData.push([fecha, cantidad]);
            });
            
            const wsCiclos = XLSX.utils.aoa_to_sheet(ciclosData);
            wsCiclos['!cols'] = [{wch:15}, {wch:10}];
            XLSX.utils.book_append_sheet(wb, wsCiclos, 'Ciclos por Día');
            
            // Hoja 3: Eventos recientes
            const eventosData = [['Fecha', 'Tipo', 'Evento', 'Detalles']];
            this.eventos.slice(0, 500).forEach(evento => {
                eventosData.push([
                    new Date(evento.timestamp).toLocaleString(),
                    evento.tipo,
                    evento.datos.estado || evento.datos.abierto || '-',
                    this.formatearDetalles(evento.datos)
                ]);
            });
            
            const wsEventos = XLSX.utils.aoa_to_sheet(eventosData);
            wsEventos['!cols'] = [{wch:20}, {wch:12}, {wch:15}, {wch:30}];
            XLSX.utils.book_append_sheet(wb, wsEventos, 'Eventos');
            
            // Guardar archivo
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `reporte_porton_${fecha}.xlsx`);
            
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    }
}

// Inicializar generador
const generadorPDF = new GeneradorPDF();

// Funciones globales para PDF
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
