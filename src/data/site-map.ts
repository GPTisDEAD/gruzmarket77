// Единый источник слагов и названий до нарезки corpus (этап 2 заменит на collections)

export const SERVICES = [
  { slug: 'demontazh',            title: 'Демонтажные работы',        corpus: '§6.1' },
  { slug: 'uborka-posle-remonta', title: 'Уборка после ремонта',      corpus: '§6.2' },
  { slug: 'klining-ofisov',       title: 'Клининг офисов',            corpus: '§6.3' },
  { slug: 'vlazhnaya-uborka',     title: 'Влажная уборка',            corpus: '§6.4' },
  { slug: 'mytyo-okon',           title: 'Мытьё окон',                corpus: '§6.5' },
  { slug: 'uborka-territoriy',    title: 'Уборка территорий',         corpus: '§6.6' },
  { slug: 'gruzchiki',            title: 'Грузчики и хелперы',        corpus: '§6.7' },
  { slug: 'otdelochnye-raboty',   title: 'Отделочные работы',         corpus: '§6.8' },
  { slug: 'elektrika-santekhnika',title: 'Электрики и сантехники',    corpus: '§6.9' },
  { slug: 'monolit-styazhka',     title: 'Монолитные работы и стяжка',corpus: '§6.10' },
  { slug: 'otdelka-pod-klyuch',   title: 'Отделка под ключ',          corpus: '§6.11' },
  { slug: 'dom-pod-klyuch',       title: 'Частный дом под ключ',      corpus: '§6.12' },
  { slug: 'oblitsovka',           title: 'Облицовочные работы',       corpus: '§6.13' },
  { slug: 'landshaft',            title: 'Ландшафтные работы',        corpus: '§6.14' }
] as const;

export const CASES = [
  { slug: 'demontazh-kvartiry-78', title: 'Демонтаж квартиры 78 м² перед капремонтом', corpus: '§8.1' },
  { slug: 'uborka-ofisa-240',      title: 'Уборка после ремонта офиса 240 м²',          corpus: '§8.2' },
  { slug: 'helpery-vystavka',      title: 'Хелперы на выставку — монтаж и демонтаж стендов', corpus: '§8.3' },
  { slug: 'sanuzel-kuhnya',        title: 'Санузел и кухня под ключ',                   corpus: '§8.4' },
  { slug: 'abonent-klining-120',   title: 'Абонентский клининг офиса 120 м²',           corpus: '§8.5' }
] as const;

export const AUDIENCES = [
  { slug: 'dlya-prorabov',     title: 'Прорабам и подрядчикам',          corpus: '§5.1' },
  { slug: 'dlya-biznesa',      title: 'УК, офисам и клининговым компаниям', corpus: '§5.2' },
  { slug: 'dlya-meropriyatiy', title: 'Ивент-агентствам и площадкам',    corpus: '§5.3' },
  { slug: 'chastnym-klientam', title: 'Частным клиентам',                corpus: '§5.4' }
] as const;
