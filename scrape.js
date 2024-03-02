const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Define the URL of the webpage you want to scrape
const url = 'https://old.sparenergi.dk/forbruger/vaerktoejer/find-dit-energimaerke';

// Data to be filled in the form fields
const formData = {
    zipcode: '2800',
    street: 'Ulrikkenborg Plads',
    number: '1'
};

(async () => {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2'});

    await page.waitForSelector('#edit-zipcode');

    await page.type('#edit-zipcode', '2800');

    // await page.$eval('#edit-zipcode', el => el.value = '2800');

    // await page.click('input[type="submit"]');
    // await page.waitForSelector('#mw-content-text');
    const text = await page.evaluate(() => {
        const zip = document.querySelector('#edit-zipcode');
        return zip.outerHTML;
    });
    console.log(text);
    await browser.close();
})();

// // Function to submit the form and return the result
// async function submitFormAndGetResult() {
//     try {

//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         await page.goto(url);

//         // Fill in the form fields
//         await page.type('#edit-zipcode', formData.zipcode);
//         await page.type('#edit-street', formData.street);
//         await page.type('#edit-number', formData.number);

//         // Click the submit button
//         // await page.click('#edit-submit-demo');

//         // Wait for a short delay to ensure the form submission is complete
//         delay(2000);

//         // Retrieve the content of the div with class "demo-search-el"
//         const demoSearchContent = await page.evaluate(() => {
//             // return document.get('page').innerHTML;
//             return document.getElementById('zone-content').innerHTML;
//         });
//         console.log(demoSearchContent)

//         // Close the browser
//         await browser.close();
//     } catch (error) {
//         console.error('Error:', error);
//         return null;
//     }
// }

// // Call the function to submit the form and get the result
// submitFormAndGetResult();

// function delay(time) {
//     return new Promise(function(resolve) { 
//         setTimeout(resolve, time)
//     });
//  }