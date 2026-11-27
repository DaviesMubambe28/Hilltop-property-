import { test, expect } from '@playwright/test';

test.describe('Homepage hero slideshow', () => {
  test.use({ reducedMotion: 'reduce' });

  test('loads five photographs and supports manual navigation', async ({
    page,
  }) => {
    await page.goto('/');

    const hero = page.locator('#homepage-hero');
    const controls = hero.locator('#hero-slideshow-controls');
    const activeSlide = hero.locator('.hero-slide.is-active');

    await expect(controls).toBeVisible();
    await expect(hero.locator('.hero-slide')).toHaveCount(5);
    await expect(hero.locator('.hero-slide-dot')).toHaveCount(5);
    await expect(activeSlide).toHaveCount(1);
    await expect(activeSlide).toHaveAttribute('data-hero-slide', 'villa');

    await expect(
      hero.getByRole('button', { name: 'Play background slideshow' }),
    ).toBeVisible();

    await hero.getByRole('button', {
      name: 'Next background photograph',
    }).click();
    await expect(activeSlide).toHaveAttribute(
      'data-hero-slide',
      'family-home',
    );
    await expect(hero.locator('[data-hero-slide="villa"]')).toHaveCSS(
      'opacity',
      '0',
    );
    await expect(activeSlide).toHaveCSS('opacity', '1');

    await hero
      .getByRole('button', { name: /Show Victoria Falls/ })
      .click();
    await expect(activeSlide).toHaveAttribute(
      'data-hero-slide',
      'victoria-falls',
    );
    await expect(hero.locator('#hero-image-provenance')).toHaveText(
      'Victoria Falls, Zambia',
    );
    await expect(hero.locator('#hero-falls-credit')).toBeVisible();
    await expect(
      hero.locator('.hero-slide-dot[aria-current="true"]'),
    ).toHaveCount(1);

    await hero
      .getByRole('button', { name: 'Previous background photograph' })
      .click();
    await expect(activeSlide).toHaveAttribute(
      'data-hero-slide',
      'apartments',
    );
    await expect(hero.locator('#hero-falls-credit')).toBeHidden();
  });

  test('preserves the opening image when additional images fail', async ({
    page,
  }) => {
    await page.route('**/assets/hero/**', (route) => route.abort());

    await page.goto('/');

    const hero = page.locator('#homepage-hero');

    await expect(hero.locator('.hero-slide-dot')).toHaveCount(1);
    await expect(hero.locator('.hero-slide')).toHaveCount(1);
    await expect(
      hero.locator('.hero-slide.is-active'),
    ).toHaveAttribute('data-hero-slide', 'villa');
    await expect(hero.locator('#hero-slideshow-controls')).toBeHidden();
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('automatically advances when motion is permitted', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.mouse.move(0, 0);

    const hero = page.locator('#homepage-hero');
    const activeSlide = hero.locator('.hero-slide.is-active');

    await expect(hero.locator('#hero-slideshow-controls')).toBeVisible();
    await expect(activeSlide).toHaveAttribute('data-hero-slide', 'villa');
    await expect(activeSlide).toHaveAttribute(
      'data-hero-slide',
      'family-home',
      { timeout: 9000 },
    );
  });
});
