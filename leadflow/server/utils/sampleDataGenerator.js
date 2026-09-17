const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Generates sample spreadsheet with varied scenarios:
 * - Businesses with genuine websites
 * - Businesses with empty/null/N/A website (Leads)
 * - Businesses with Google Maps URL in website column (Leads)
 * - Duplicates
 * - Multiple categories and cities
 */
const generateSampleSpreadsheet = (outputPath) => {
  const sampleData = [
    {
      'Business Name': 'Metro Apex Dental Care',
      'Category': 'Dentist',
      'Address': '104 Main Street',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0142',
      'Website': 'https://www.metroapexdental.com',
      'Email': 'dr.smith@metroapexdental.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1001',
      'Rating': 4.8,
      'Reviews': 142,
    },
    {
      'Business Name': 'Austin Glow Hair Salon',
      'Category': 'Hair Salon',
      'Address': '220 Congress Ave',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0199',
      'Website': '', // NO WEBSITE -> Qualified Lead!
      'Email': 'contact@austinglowsalon.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1002',
      'Rating': 4.9,
      'Reviews': 88,
    },
    {
      'Business Name': 'Hill Country Auto Repair',
      'Category': 'Auto Mechanic',
      'Address': '501 Lamar Blvd',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '+1 512 555 0188',
      'Website': 'N/A', // NO WEBSITE -> Qualified Lead!
      'Email': 'service@hillcountryauto.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1003',
      'Rating': 4.6,
      'Reviews': 62,
    },
    {
      'Business Name': 'Southside Fitness Club',
      'Category': 'Gym & Fitness',
      'Address': '890 Riverside Dr',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '5125550177',
      'Website': 'none', // NO WEBSITE -> Qualified Lead!
      'Email': '', // Lead without direct email
      'Google Maps URL': 'https://maps.google.com/?cid=1004',
      'Rating': 4.5,
      'Reviews': 45,
    },
    {
      'Business Name': 'Blue Wave Plumbing',
      'Category': 'Plumbing Service',
      'Address': '330 Barton Springs Rd',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0133',
      'Website': 'https://maps.google.com/maps?cid=55443322', // GOOGLE MAPS URL -> NO WEBSITE -> Qualified Lead!
      'Email': 'mike@bluewaveplumbing.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1005',
      'Rating': 4.7,
      'Reviews': 110,
    },
    {
      'Business Name': 'Cedar Creek Bakery',
      'Category': 'Bakery & Cafe',
      'Address': '412 6th Street',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0122',
      'Website': 'https://www.cedarcreekbakery.com', // HAS WEBSITE
      'Email': 'hello@cedarcreekbakery.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1006',
      'Rating': 4.9,
      'Reviews': 210,
    },
    {
      'Business Name': 'Austin Glow Hair Salon', // DUPLICATE in batch!
      'Category': 'Hair Salon',
      'Address': '220 Congress Ave',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0199',
      'Website': '-',
      'Email': 'contact@austinglowsalon.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1002',
      'Rating': 4.9,
      'Reviews': 88,
    },
    {
      'Business Name': 'Lone Star Pet Grooming',
      'Category': 'Pet Care',
      'Address': '700 Guadalupe St',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0111',
      'Website': 'not available', // NO WEBSITE -> Qualified Lead!
      'Email': 'grooming@lonestarpet.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1007',
      'Rating': 4.8,
      'Reviews': 74,
    },
    {
      'Business Name': 'Zilker Law Partners',
      'Category': 'Legal Services',
      'Address': '1200 Lavaca St',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0155',
      'Website': 'https://www.zilkerlaw.com', // HAS WEBSITE
      'Email': 'info@zilkerlaw.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1008',
      'Rating': 4.4,
      'Reviews': 31,
    },
    {
      'Business Name': 'Summit Roofing Solutions',
      'Category': 'Roofing Contractor',
      'Address': '1400 Airport Blvd',
      'City': 'Austin',
      'State': 'TX',
      'Country': 'USA',
      'Phone': '(512) 555-0166',
      'Website': '', // NO WEBSITE -> Qualified Lead!
      'Email': 'quotes@summitroofing.com',
      'Google Maps URL': 'https://maps.google.com/?cid=1009',
      'Rating': 4.7,
      'Reviews': 93,
    },
  ];

  const ws = xlsx.utils.json_to_sheet(sampleData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Businesses');

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  xlsx.writeFile(wb, outputPath);
  console.log(`[Sample Data] Generated sample spreadsheet at: ${outputPath}`);
  return outputPath;
};

if (require.main === module) {
  const target = path.join(__dirname, '../../sample_data/sample_businesses.xlsx');
  generateSampleSpreadsheet(target);
}

module.exports = { generateSampleSpreadsheet };

