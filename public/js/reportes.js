$(document).ready(function() {
  $('#tablaInventario').DataTable({
    ajax: { url: '/api/reportes/inventario', dataSrc: '' },
    columns: [
      { data: 'descripcion' },
      { data: 'unidad_medida' },
      { data: 'stock' }
    ]
  });
});
