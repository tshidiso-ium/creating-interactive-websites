const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

    const initialCount = await page.locator('.project-card').count();
    console.log('Initial project cards:', initialCount);

    // Attempt to create invalid project (name < 5)
    await page.click('#new-project-btn');
    await page.fill('input[name="name"]', 'Abc');
    await page.fill('textarea[name="description"]', 'Short name test');

    // handle alert
    page.once('dialog', async dialog => {
      console.log('Dialog message (expected validation):', dialog.message());
      await dialog.accept();
    });
    await page.click('button[type="submit"]');

    const afterInvalid = await page.locator('.project-card').count();
    if (afterInvalid !== initialCount) throw new Error('Invalid project was created (validation failed)');
    console.log('Validation prevented short name project as expected');

    // close modal (validation left dialog open)
    await page.evaluate(() => {
      const d = document.getElementById('new-project-modal')
      if (d && typeof d.close === 'function') d.close()
    })

    // Create a valid project (no finish date => default should be used)
    await page.click('#new-project-btn');
    const projectName = 'MyProjectTest';
    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', 'A proper project description');
    // leave date empty
    await page.click('button[type="submit"]');

    // wait for new card with project name
    await page.locator('.project-card h5', { hasText: projectName }).waitFor({ timeout: 5000 });
    const newCount = await page.locator('.project-card').count();
    console.log('Project cards after create:', newCount);
    if (newCount !== initialCount + 1) throw new Error('Project was not created');

    // find the newest card (last)
    const lastCard = page.locator('.project-card').nth(newCount - 1);
    const lastEl = await lastCard.elementHandle();
    const lastHTML = await page.evaluate(el => el.outerHTML, lastEl);
    console.log('Last card HTML:', lastHTML);
    const iconHandle = lastCard.locator('.project-icon');
    if (!await iconHandle.count()) throw new Error('Project icon element not found');
    const initials = (await iconHandle.textContent()).trim();
    console.log('Icon initials:', initials);
    if (initials !== projectName.slice(0,2).toUpperCase()) throw new Error('Initials do not match expected uppercase letters');

    const iconElHandle = await iconHandle.elementHandle();
    const bg = await page.evaluate(el => getComputedStyle(el).backgroundColor, iconElHandle);
    console.log('Icon background-color:', bg);
    if (!bg || bg === 'rgba(0, 0, 0, 0)') throw new Error('Icon background color not set');

    // Open project details by clicking the card
    await lastCard.click();
    await page.waitForSelector('#project-details', { state: 'visible' });

    // Setup dialog handler sequence for adding ToDo (title, description, dueDate, status)
    const answers = ['Build UI', 'Implement UI for project', '2026-06-11', 'in-progress'];
    let ai = 0;
    page.on('dialog', async dialog => {
      const a = answers[ai++] || '';
      console.log('Auto-responding to prompt:', dialog.message(), '=>', a);
      await dialog.accept(a);
    });

    await page.click('#add-todo-btn');

    // wait for todo item to appear
    await page.waitForSelector('#todos-list .todo-item');
    const todos = await page.locator('#todos-list .todo-item').count();
    console.log('ToDo items count:', todos);
    if (todos < 1) throw new Error('ToDo was not created');

    // Check the class for status (should reflect 'in-progress')
    const todoEl = (await page.locator('#todos-list .todo-item').first());
    const className = await todoEl.getAttribute('class');
    console.log('ToDo element classes:', className);
    if (!className.includes('todo-status-in-progress')) throw new Error('ToDo status class not set to in-progress');

    console.log('All checks passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
