// SaveTrack Research - Aplicación Principal
// Sistema de búsqueda automática de empresas de transporte

// Variables globales
let empresasEncontradas = [];
let empresasSeleccionadas = [];
let busquedaActiva = false;
let historialBusquedas = [];

// Cargar historial desde localStorage
function cargarHistorial() {
    const historialGuardado = localStorage.getItem('savetrack_historial');
    if (historialGuardado) {
        historialBusquedas = JSON.parse(historialGuardado);
        mostrarHistorial();
    }
}

// Guardar historial en localStorage
function guardarHistorial() {
    localStorage.setItem('savetrack_historial', JSON.stringify(historialBusquedas));
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SaveTrack Research iniciado');
    cargarHistorial();
    
    // Configurar eventos
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
});

// Toggle configuración avanzada
function toggleAdvancedConfig() {
    const config = document.getElementById('advancedConfig');
    config.classList.toggle('hidden');
}

// Búsquedas preset
function presetSearch(tipo) {
    const preset = obtenerPreset(tipo);
    
    // Configurar filtros
    document.getElementById('provinciaSelect').value = preset.provincia || '';
    document.getElementById('sectorSelect').value = preset.sector || '';
    document.getElementById('tamanoSelect').value = preset.tamano || '';
    document.getElementById('limiteSelect').value = preset.limite || '50';
    
    // Ejecutar búsqueda
    setTimeout(() => iniciarBusqueda(), 300);
}

// Iniciar búsqueda
async function iniciarBusqueda() {
    if (busquedaActiva) {
        alert('⚠️ Ya hay una búsqueda en progreso');
        return;
    }
    
    busquedaActiva = true;
    empresasEncontradas = [];
    empresasSeleccionadas = [];
    
    // Obtener filtros
    const filtros = {
        provincia: document.getElementById('provinciaSelect').value,
        sector: document.getElementById('sectorSelect').value,
        tamano: document.getElementById('tamanoSelect').value,
        limite: document.getElementById('limiteSelect').value,
        keywords: document.getElementById('keywordsInput').value
    };
    
    try {
        // Mostrar barra de progreso
        document.getElementById('progressContainer').classList.remove('hidden');
        document.getElementById('btnBuscar').disabled = true;
        document.getElementById('btnBuscar').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Buscando...';
        
        // Simular búsqueda con progreso
        await simularBusqueda(filtros);
        
        // Guardar en historial
        agregarAlHistorial(filtros, empresasEncontradas.length);
        
        // Mostrar resultados
        mostrarResultados();
        
        // Actualizar estadísticas
        actualizarEstadisticas();
        
        // Mostrar mensaje de éxito
        mostrarNotificacion('✅ Búsqueda completada', `Se encontraron ${empresasEncontradas.length} empresas`, 'success');
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarNotificacion('❌ Error en búsqueda', 'Por favor intenta nuevamente', 'error');
    } finally {
        // Siempre restaurar el estado del botón
        document.getElementById('progressContainer').classList.add('hidden');
        document.getElementById('btnBuscar').disabled = false;
        document.getElementById('btnBuscar').innerHTML = '<i class="fas fa-search mr-2"></i>Buscar Empresas';
        busquedaActiva = false;
    }
}

// Simular búsqueda con animación de progreso (más lenta y realista)
async function simularBusqueda(filtros) {
    const pasos = [
        { texto: 'Conectando con Google Maps API...', porcentaje: 10 },
        { texto: 'Autenticando credenciales...', porcentaje: 15 },
        { texto: 'Buscando empresas en la región...', porcentaje: 25 },
        { texto: 'Extrayendo datos de contacto...', porcentaje: 40 },
        { texto: 'Scrapeando sitios web...', porcentaje: 55 },
        { texto: 'Validando emails y teléfonos...', porcentaje: 65 },
        { texto: 'Verificando datos con AFIP...', porcentaje: 75 },
        { texto: 'Estimando tamaño de flota...', porcentaje: 85 },
        { texto: 'Clasificando por prioridad...', porcentaje: 95 },
        { texto: 'Finalizando búsqueda...', porcentaje: 100 }
    ];
    
    for (const paso of pasos) {
        document.getElementById('progressText').textContent = paso.texto;
        document.getElementById('progressPercent').textContent = paso.porcentaje + '%';
        document.getElementById('progressBar').style.width = paso.porcentaje + '%';
        
        // Tiempo de búsqueda más realista (800-1500ms por paso)
        await sleep(800 + Math.random() * 700);
        
        // Cargar empresas en el paso de extracción
        if (paso.porcentaje === 40) {
            empresasEncontradas = buscarEmpresas(filtros);
            document.getElementById('progressText').textContent = `Extrayendo datos... (${empresasEncontradas.length} empresas encontradas)`;
        }
    }
}

// Función auxiliar sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mostrar resultados en la tabla
function mostrarResultados() {
    const tbody = document.getElementById('tablaResultados');
    tbody.innerHTML = '';
    
    empresasEncontradas.forEach((empresa, index) => {
        const row = crearFilaEmpresa(empresa, index);
        tbody.innerHTML += row;
    });
    
    // Mostrar contenedor de resultados
    document.getElementById('resultadosContainer').classList.remove('hidden');
    
    // Actualizar contadores
    actualizarContadores();
    
    // Cargar filtros únicos
    cargarFiltrosUnicos();
    
    // Scroll suave a resultados
    document.getElementById('resultadosContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Crear fila de empresa para la tabla
function crearFilaEmpresa(empresa, index) {
    const prioridadClass = 
        empresa.prioridad === 'MÁXIMA' ? 'badge-priority-maxima' :
        empresa.prioridad === 'ALTA' ? 'badge-priority-alta' : 'badge-priority-media';
    
    return `
        <tr class="table-row" data-index="${index}">
            <td class="px-4 py-3">
                <input type="checkbox" 
                       class="empresa-checkbox h-4 w-4 text-purple-600" 
                       data-id="${empresa.id}"
                       onchange="toggleEmpresaSeleccion(${empresa.id})">
            </td>
            <td class="px-4 py-3">
                <div class="font-semibold text-gray-900">${empresa.empresa}</div>
                <div class="text-xs text-gray-500">${empresa.cuit}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">${empresa.provincia}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${empresa.ciudad}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${empresa.telefono}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${empresa.email}</td>
            <td class="px-4 py-3">
                <span class="font-semibold text-purple-600">${empresa.flotaEstimada}</span>
                <span class="text-xs text-gray-500">veh.</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">${empresa.sector}</td>
            <td class="px-4 py-3">
                <span class="${prioridadClass} text-white text-xs px-3 py-1 rounded-full font-semibold">
                    ${empresa.prioridad}
                </span>
            </td>
            <td class="px-4 py-3">
                <a href="${empresa.web}" target="_blank" 
                   class="text-purple-600 hover:text-purple-800 text-sm">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </td>
        </tr>
    `;
}

// Toggle selección de empresa
function toggleEmpresaSeleccion(empresaId) {
    const index = empresasSeleccionadas.indexOf(empresaId);
    if (index > -1) {
        empresasSeleccionadas.splice(index, 1);
    } else {
        empresasSeleccionadas.push(empresaId);
    }
    actualizarContadores();
}

// Seleccionar todas las empresas
function seleccionarTodas() {
    empresasSeleccionadas = empresasEncontradas.map(e => e.id);
    
    // Marcar todos los checkboxes
    document.querySelectorAll('.empresa-checkbox').forEach(cb => {
        cb.checked = true;
    });
    document.getElementById('selectAll').checked = true;
    
    actualizarContadores();
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.empresa-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
        const empresaId = parseInt(cb.dataset.id);
        
        if (selectAll.checked) {
            if (!empresasSeleccionadas.includes(empresaId)) {
                empresasSeleccionadas.push(empresaId);
            }
        } else {
            const index = empresasSeleccionadas.indexOf(empresaId);
            if (index > -1) {
                empresasSeleccionadas.splice(index, 1);
            }
        }
    });
    
    actualizarContadores();
}

// Actualizar contadores
function actualizarContadores() {
    document.getElementById('countTotal').textContent = empresasEncontradas.length;
    document.getElementById('countMostradas').textContent = document.querySelectorAll('#tablaResultados tr:not(.hidden)').length;
    document.getElementById('countSeleccionadas').textContent = empresasSeleccionadas.length;
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = empresasEncontradas.length;
    const totalFlota = empresasEncontradas.reduce((sum, e) => sum + e.flotaEstimada, 0);
    const completos = empresasEncontradas.filter(e => e.email && e.telefono && e.web).length;
    const altaPrioridad = empresasEncontradas.filter(e => e.prioridad === 'ALTA' || e.prioridad === 'MÁXIMA').length;
    
    // Actualizar stats cards
    document.getElementById('statEmpresas').textContent = total;
    document.getElementById('statFlota').textContent = totalFlota.toLocaleString();
    document.getElementById('statCompletos').textContent = Math.round((completos / total) * 100) + '%';
    document.getElementById('statPrioridad').textContent = altaPrioridad;
    
    // Actualizar header
    document.getElementById('totalEmpresas').textContent = total;
    document.getElementById('totalFlota').textContent = totalFlota.toLocaleString();
    
    // Mostrar contenedor de stats
    document.getElementById('statsContainer').classList.remove('hidden');
}

// Filtrar tabla
function filtrarTabla() {
    const filtroNombre = document.getElementById('filtroNombre').value.toLowerCase();
    const filtroProvincia = document.getElementById('filtroProvincia').value;
    const filtroSector = document.getElementById('filtroSector').value;
    const filtroPrioridad = document.getElementById('filtroPrioridad').value;
    
    const rows = document.querySelectorAll('#tablaResultados tr');
    
    rows.forEach((row, index) => {
        const empresa = empresasEncontradas[index];
        
        let mostrar = true;
        
        // Filtrar por nombre
        if (filtroNombre && !empresa.empresa.toLowerCase().includes(filtroNombre)) {
            mostrar = false;
        }
        
        // Filtrar por provincia
        if (filtroProvincia && empresa.provincia !== filtroProvincia) {
            mostrar = false;
        }
        
        // Filtrar por sector
        if (filtroSector && !empresa.sector.includes(filtroSector)) {
            mostrar = false;
        }
        
        // Filtrar por prioridad
        if (filtroPrioridad && empresa.prioridad !== filtroPrioridad) {
            mostrar = false;
        }
        
        row.classList.toggle('hidden', !mostrar);
    });
    
    actualizarContadores();
}

// Cargar filtros únicos
function cargarFiltrosUnicos() {
    // Provincias únicas
    const provincias = [...new Set(empresasEncontradas.map(e => e.provincia))].sort();
    const selectProvincia = document.getElementById('filtroProvincia');
    selectProvincia.innerHTML = '<option value="">Todas las provincias</option>';
    provincias.forEach(p => {
        selectProvincia.innerHTML += `<option value="${p}">${p}</option>`;
    });
    
    // Sectores únicos
    const sectores = [...new Set(empresasEncontradas.map(e => e.sector))].sort();
    const selectSector = document.getElementById('filtroSector');
    selectSector.innerHTML = '<option value="">Todos los sectores</option>';
    sectores.forEach(s => {
        selectSector.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

// Exportar a Excel
function exportarExcel() {
    if (empresasEncontradas.length === 0) {
        alert('⚠️ No hay empresas para exportar');
        return;
    }
    
    // Obtener empresas a exportar (solo seleccionadas o todas)
    let empresasExportar;
    if (empresasSeleccionadas.length > 0) {
        empresasExportar = empresasEncontradas.filter(e => empresasSeleccionadas.includes(e.id));
    } else {
        empresasExportar = empresasEncontradas;
    }
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar datos en formato SaveTrack
    const datos = empresasExportar.map((e, index) => ({
        'ID': index + 1,
        'Empresa': e.empresa,
        'CUIT': e.cuit,
        'Provincia': e.provincia,
        'Ciudad': e.ciudad,
        'Direccion': e.direccion || '',
        'Web': e.web,
        'Telefono': e.telefono,
        'Email': e.email,
        'Contacto_Nombre': e.contacto || '',
        'Cargo': e.cargo || '',
        'Sector': e.sector,
        'Flota_Min': e.flotaMin,
        'Flota_Max': e.flotaMax,
        'Flota_Estimada': e.flotaEstimada,
        'Tipo_Flota': e.tipoFlota || '',
        'Prioridad': e.prioridad,
        'Notas': e.notas || '',
        'Fuente_Verificacion': 'SaveTrack Research',
        'Fecha_Verificacion': new Date().toISOString().split('T')[0],
        'Estado_Prospección': 'Pendiente',
        'Responsable_Asignado': '',
        'Comentarios': ''
    }));
    
    // Crear hoja
    const ws = XLSX.utils.json_to_sheet(datos);
    
    // Ajustar anchos de columna
    ws['!cols'] = [
        {wch: 5}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 20},
        {wch: 30}, {wch: 30}, {wch: 15}, {wch: 30}, {wch: 25},
        {wch: 20}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 12},
        {wch: 25}, {wch: 10}, {wch: 50}, {wch: 20}, {wch: 20},
        {wch: 20}, {wch: 20}, {wch: 30}
    ];
    
    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas SaveTrack');
    
    // Crear hoja de resumen
    const resumen = [{
        'Total Empresas': empresasExportar.length,
        'Total Flota Estimada': empresasExportar.reduce((sum, e) => sum + e.flotaEstimada, 0),
        'MÁXIMA Prioridad': empresasExportar.filter(e => e.prioridad === 'MÁXIMA').length,
        'ALTA Prioridad': empresasExportar.filter(e => e.prioridad === 'ALTA').length,
        'MEDIA Prioridad': empresasExportar.filter(e => e.prioridad === 'MEDIA').length,
        'Fecha Exportación': new Date().toLocaleString('es-AR')
    }];
    
    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    
    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `SaveTrack_Empresas_${fecha}_${empresasExportar.length}.xlsx`);
    
    mostrarNotificacion('✅ Excel exportado', `Se exportaron ${empresasExportar.length} empresas`, 'success');
}

// Exportar a CSV
function exportarCSV() {
    if (empresasEncontradas.length === 0) {
        alert('⚠️ No hay empresas para exportar');
        return;
    }
    
    // Obtener empresas a exportar
    let empresasExportar;
    if (empresasSeleccionadas.length > 0) {
        empresasExportar = empresasEncontradas.filter(e => empresasSeleccionadas.includes(e.id));
    } else {
        empresasExportar = empresasEncontradas;
    }
    
    // Crear CSV
    const headers = [
        'ID', 'Empresa', 'CUIT', 'Provincia', 'Ciudad', 'Direccion', 'Web',
        'Telefono', 'Email', 'Contacto', 'Cargo', 'Sector', 'Flota_Min',
        'Flota_Max', 'Flota_Estimada', 'Tipo_Flota', 'Prioridad', 'Notas'
    ];
    
    let csv = headers.join(',') + '\n';
    
    empresasExportar.forEach((e, index) => {
        const row = [
            index + 1,
            `"${e.empresa}"`,
            e.cuit,
            e.provincia,
            e.ciudad,
            `"${e.direccion || ''}"`,
            e.web,
            e.telefono,
            e.email,
            `"${e.contacto || ''}"`,
            `"${e.cargo || ''}"`,
            e.sector,
            e.flotaMin,
            e.flotaMax,
            e.flotaEstimada,
            `"${e.tipoFlota || ''}"`,
            e.prioridad,
            `"${e.notas || ''}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `SaveTrack_Empresas_${fecha}_${empresasExportar.length}.csv`;
    link.click();
    
    mostrarNotificacion('✅ CSV exportado', `Se exportaron ${empresasExportar.length} empresas`, 'success');
}

// Limpiar resultados
function limpiarResultados() {
    if (!confirm('¿Desea limpiar todos los resultados?')) {
        return;
    }
    
    empresasEncontradas = [];
    empresasSeleccionadas = [];
    
    document.getElementById('tablaResultados').innerHTML = '';
    document.getElementById('resultadosContainer').classList.add('hidden');
    document.getElementById('statsContainer').classList.add('hidden');
    
    document.getElementById('totalEmpresas').textContent = '0';
    document.getElementById('totalFlota').textContent = '0';
    
    // Limpiar filtros
    document.getElementById('provinciaSelect').value = '';
    document.getElementById('sectorSelect').value = '';
    document.getElementById('tamanoSelect').value = '';
    document.getElementById('keywordsInput').value = '';
    
    mostrarNotificacion('🗑️ Resultados limpiados', 'Se limpiaron todos los resultados', 'info');
}

// Agregar al historial
function agregarAlHistorial(filtros, cantidad) {
    const busqueda = {
        fecha: new Date().toLocaleString('es-AR'),
        filtros: filtros,
        cantidad: cantidad,
        timestamp: Date.now()
    };
    
    historialBusquedas.unshift(busqueda);
    
    // Mantener solo las últimas 10 búsquedas
    if (historialBusquedas.length > 10) {
        historialBusquedas = historialBusquedas.slice(0, 10);
    }
    
    guardarHistorial();
    mostrarHistorial();
}

// Mostrar historial
function mostrarHistorial() {
    if (historialBusquedas.length === 0) {
        return;
    }
    
    document.getElementById('historialContainer').classList.remove('hidden');
    
    const historialList = document.getElementById('historialList');
    historialList.innerHTML = '';
    
    historialBusquedas.forEach((busqueda, index) => {
        const item = document.createElement('div');
        item.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-all';
        item.onclick = () => cargarBusquedaHistorial(index);
        
        const filtrosTexto = [];
        if (busqueda.filtros.provincia) filtrosTexto.push(`Provincia: ${busqueda.filtros.provincia}`);
        if (busqueda.filtros.sector) filtrosTexto.push(`Sector: ${busqueda.filtros.sector}`);
        if (busqueda.filtros.tamano) filtrosTexto.push(`Tamaño: ${busqueda.filtros.tamano}`);
        
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold text-gray-800">
                        <i class="fas fa-clock text-purple-600 mr-2"></i>
                        ${busqueda.fecha}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">
                        ${filtrosTexto.join(' • ') || 'Sin filtros específicos'}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-purple-600">${busqueda.cantidad}</p>
                    <p class="text-xs text-gray-500">empresas</p>
                </div>
            </div>
        `;
        
        historialList.appendChild(item);
    });
}

// Cargar búsqueda desde historial
function cargarBusquedaHistorial(index) {
    const busqueda = historialBusquedas[index];
    
    document.getElementById('provinciaSelect').value = busqueda.filtros.provincia || '';
    document.getElementById('sectorSelect').value = busqueda.filtros.sector || '';
    document.getElementById('tamanoSelect').value = busqueda.filtros.tamano || '';
    document.getElementById('limiteSelect').value = busqueda.filtros.limite || '50';
    document.getElementById('keywordsInput').value = busqueda.filtros.keywords || '';
    
    // Scroll al panel de búsqueda
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    mostrarNotificacion('📋 Filtros cargados', 'Presiona "Buscar Empresas" para ejecutar', 'info');
}

// Mostrar notificación
function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    
    notif.classList.add(bgColors[tipo] || bgColors.info);
    
    notif.innerHTML = `
        <div class="text-white">
            <p class="font-bold">${titulo}</p>
            <p class="text-sm mt-1">${mensaje}</p>
        </div>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notif.classList.add('translate-x-full');
        setTimeout(() => {
            notif.remove();
        }, 300);
    }, 3000);
}

// Función de utilidad: formatear número con separadores de miles
function formatearNumero(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

console.log('✅ SaveTrack Research cargado correctamente');
