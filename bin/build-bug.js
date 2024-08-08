/**
 * build common files with react module in it
 */
const fs = require('fs/promises')
const pug = require('pug')

exports.buildPug = async (from, to, data) => {
  const pugContent = await fs.readFile(from, 'utf8')
  const htmlContent = pug.render(pugContent, {
    filename: from,
    ...data
  })
  await fs.writeFile(to, htmlContent, 'utf8')
}
