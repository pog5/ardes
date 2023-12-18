const cheerio = require("cheerio");
 
interface Product {
  sku: string;
  name: string;
  url: string;
  price: number;
  description: string;
  [key: string]: any;
}

async function getRandom(min: number, max: number): Promise<number> {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getPageHTML(url: string): Promise<string> {
  try {
    let resposnecode = 0;
    let response = await fetch(url, { headers: { 'Cookie': 'per_page=1280' } });
    resposnecode = response.status;
    while (resposnecode != 200) {
      let delay = await getRandom(1000, 3000);
      await new Promise(r => setTimeout(r, delay));
      response = await fetch(url);
      resposnecode = response.status;
    } 
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching data:', error);
    return Promise.reject(error);
  }
}

async function getProductFromURL(url: string): Promise<Product> {
  try {
    let resposnecode = 0;
    let response = await fetch(url);
    resposnecode = response.status;
    while (resposnecode != 200) {
      let delay = await getRandom(1000, 3000);
      await new Promise(r => setTimeout(r, delay));
      response = await fetch(url);
      resposnecode = response.status;
    } 
    const html = await response.text();
    const $ = cheerio.load(html);
    const levaElement = $('#price-tag');
    const stotinkiElement = $('#buying-info > div.common-price.d-flex.align-items-center > span.full-price > sup');
    if (levaElement.length < 1 || stotinkiElement.length < 1) {
      throw new Error('Price not found\n' + html);
    }
      const priceString = levaElement.text().trim() + '.' + stotinkiElement.text().trim();
      let product: Product = {
        name: $('h1').text().trim(),
        sku: $('h1').text().trim().toUpperCase().split(' ')[$('h1').text().trim().toUpperCase().split(' ').length-1],
        url: url,
        price: priceString ? parseFloat(priceString) : NaN,
        description: $('#cont_2 > div > div.row.align-items-start > div.product-chars.col-xl-4.col-lg-6.order-1 > div.row.middlecols > div.tech-specs.col-lg-12.col-sm-6.col-12 > div > ul').text().trim().replace(/  /g, '')
      };
      return product;
  } catch (error) {
    console.error('Error fetching data:', error);
    return Promise.reject(error);
  }
}

async function getDrives(): Promise<Product[]> {
  try {
    const $ = cheerio.load(await getPageHTML('https://ardes.bg/komponenti/tvardi-diskove/ssd-solid-state-drive'));
    const drives: Product[] = [];

    const driveLinks = $('a[href^="/product/"]').toArray();

    await Promise.all(
      driveLinks.map(async (element:string) => {
        const sku = $(element).attr('href')?.replace('/product/', '');
        const url = "https://ardes.bg/product/" + sku;
        const product = await getProductFromURL(url);
        drives.push(product);
      })
    );
    return drives;
  } catch (error) {
    Promise.reject(error);
  }
  return Promise.reject();
}

async function getGPUs(): Promise<Product[]> {
  try {
    const $ = cheerio.load(await getPageHTML('https://ardes.bg/komponenti/video-karti'));
    const gpus: Product[] = [];

    const gpuLinks = $('a[href^="/product/"]').toArray();

    await Promise.all(
      gpuLinks.map(async (element:string) => {
        const sku = $(element).attr('href')?.replace('/product/', '');
        const url = "https://ardes.bg/product/" + sku;
        const product = await getProductFromURL(url);
        gpus.push(product);
      })
    );
    return gpus;
  } catch (error) {
    Promise.reject(error);
  }
  return Promise.reject();
}

getDrives().then((drives) => {
  console.log("SSDs: \n");
  console.log(drives);
});

getGPUs().then((gpus) => {
  console.log("GPUs: \n");
  console.log(gpus);
});