const products = [
    { lot_number: 'LOT-001 ', brand: 'HP' },
    { lot_number: ' LOT-002', brand: 'Dell' },
    { lot_number: null, brand: 'Apple' },
    { brand: 'Lenovo' }
];

const filters = { lot_number: '', brand: '', series: '' };

const lots = new Set();
products.forEach(p => {
    if (p.lot_number) {
        lots.add(p.lot_number.trim());
    }
});

console.log('Lots:', Array.from(lots).sort());

const compare = (val1, val2) => 
    (val1 || '').trim().toLowerCase() === (val2 || '').trim().toLowerCase();

const brands = new Set();
products.filter(p => !filters.lot_number || compare(p.lot_number, filters.lot_number))
    .forEach(p => p.brand && brands.add(p.brand));

console.log('Brands:', Array.from(brands).sort());
