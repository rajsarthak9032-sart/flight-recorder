/**
 * Routing & Navigation Verification Test Suite
 * Validates that all navigation items have exact, distinct routes and correct file targets.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAVIGATION_ITEMS, isNavigationItemActive } from '../src/components/layout/sidebar-routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Routing and Navigation Suite', () => {
  test('All navigation items in Sidebar.tsx have distinct and valid paths', () => {
    const paths = NAVIGATION_ITEMS.map((item) => item.href);
    const uniquePaths = new Set(paths);
    assert.equal(paths.length, uniquePaths.size, 'All navigation item hrefs must be unique');

    // Expected canonical routes
    const expectedRoutes = [
      '/',
      '/flight-recorder',
      '/experiments',
      '/replay',
      '/diagnostics',
      '/models',
      '/hardware',
      '/reports',
      '/settings'
    ];

    for (const route of expectedRoutes) {
      assert.ok(paths.includes(route), `Sidebar must contain route ${route}`);
    }
  });

  test('isNavigationItemActive does not confuse routes or fall back to /replay', () => {
    // A click on /diagnostics must remain /diagnostics and NOT activate /replay
    assert.equal(isNavigationItemActive('/diagnostics', '/diagnostics'), true);
    assert.equal(isNavigationItemActive('/replay', '/diagnostics'), false);
    assert.equal(isNavigationItemActive('/experiments', '/diagnostics'), false);

    // /replay must only match replay routes
    assert.equal(isNavigationItemActive('/replay', '/replay'), true);
    assert.equal(isNavigationItemActive('/replay', '/replay-lab'), true);
    assert.equal(isNavigationItemActive('/diagnostics', '/replay'), false);

    // /experiments
    assert.equal(isNavigationItemActive('/experiments', '/experiments'), true);
    assert.equal(isNavigationItemActive('/replay', '/experiments'), false);

    // /models
    assert.equal(isNavigationItemActive('/models', '/models'), true);
    assert.equal(isNavigationItemActive('/replay', '/models'), false);

    // /hardware
    assert.equal(isNavigationItemActive('/hardware', '/hardware'), true);
    assert.equal(isNavigationItemActive('/replay', '/hardware'), false);

    // /reports
    assert.equal(isNavigationItemActive('/reports', '/reports'), true);
    assert.equal(isNavigationItemActive('/replay', '/reports'), false);

    // /settings
    assert.equal(isNavigationItemActive('/settings', '/settings'), true);
    assert.equal(isNavigationItemActive('/replay', '/settings'), false);
  });

  test('Static HTML page targets exist on disk for all routes', () => {
    const routeToFileMap = {
      '/': 'index.html',
      '/command-center': path.join('command_center', 'code.html'),
      '/flight-recorder': path.join('live_flight_recorder', 'code.html'),
      '/replay': path.join('replay_lab', 'code.html'),
      '/diagnostics': path.join('failure_diagnostics', 'code.html'),
      '/experiments': path.join('experiments', 'code.html'),
      '/models': path.join('models', 'code.html'),
      '/hardware': path.join('hardware', 'code.html'),
      '/reports': path.join('reports', 'code.html'),
      '/settings': path.join('settings', 'code.html')
    };

    for (const [route, relativePath] of Object.entries(routeToFileMap)) {
      const fullPath = path.join(rootDir, relativePath);
      assert.ok(fs.existsSync(fullPath), `Target file for route ${route} (${relativePath}) must exist`);
    }
  });

  test('Sidebar HTML in each page contains distinct links for Diagnostics, Experiments, Models, Hardware, Reports, Settings', () => {
    const pagesToCheck = [
      'index.html',
      path.join('command_center', 'code.html'),
      path.join('live_flight_recorder', 'code.html'),
      path.join('replay_lab', 'code.html'),
      path.join('failure_diagnostics', 'code.html'),
      path.join('experiments', 'code.html'),
      path.join('hardware', 'code.html'),
      path.join('models', 'code.html'),
      path.join('reports', 'code.html'),
      path.join('settings', 'code.html')
    ];

    for (const page of pagesToCheck) {
      const filePath = path.join(rootDir, page);
      const content = fs.readFileSync(filePath, 'utf8');

      // Failure Diagnostics link should point to /diagnostics (or /failure-diagnostics) and NOT /replay or #
      assert.ok(
        content.includes('href="/diagnostics"') || content.includes('href="/failure-diagnostics"'),
        `Page ${page} must link to diagnostics`
      );

      // Experiments link should point to /experiments and NOT /replay
      assert.ok(content.includes('href="/experiments"'), `Page ${page} must link to /experiments`);

      // Hardware link should point to /hardware and NOT /live-flight-recorder
      assert.ok(content.includes('href="/hardware"'), `Page ${page} must link to /hardware`);

      // Models link should point to /models and NOT /command-center
      assert.ok(content.includes('href="/models"'), `Page ${page} must link to /models`);

      // Reports link should point to /reports and NOT /failure-diagnostics
      assert.ok(content.includes('href="/reports"'), `Page ${page} must link to /reports`);

      // Settings link should point to /settings
      assert.ok(content.includes('href="/settings"'), `Page ${page} must link to /settings`);
    }
  });
});
