$(document).ready(function () {
  const tabla = $('#tablaDespacho').DataTable({
    ajax: { url: '/despacho', dataSrc: '' },
    columns: [
      { title: 'ID', data: 'id' },
      { title: 'Fecha Pedido', data: 'FechaPedido' },
      { title: 'Usuario', data: 'Usuario' },
      { title: 'Producto', data: 'Producto' },
      { title: 'Presentación', data: 'Presentacion' },
      { title: 'Entregada', data: 'Entregada' },
      { title: 'Pendiente', data: 'Pendiente' },
      { title: 'Factura', data: 'Factura' },
    ],
  });

  $('#formDespacho').on('submit', function (e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(this));
    $.ajax({
      url: '/despacho',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function () {
        tabla.ajax.reload();
        $('#formDespacho')[0].reset();
      },
      error: () => alert('❌ Error al guardar entrega'),
    });
  });
});
