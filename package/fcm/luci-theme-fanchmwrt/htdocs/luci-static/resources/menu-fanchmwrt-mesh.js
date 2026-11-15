/*
 * FanchmWrt — Mesh 组网 UI 扩展
 *
 * 不修改 wifiroam / luci-app-wifiroam 源码，仅在其之上做固件层适配：
 *   1) 普通模式（Normal Mode）菜单中把「Mesh组网」提到第一位；
 *   2) 品牌/侧栏入口指向组网首页；
 *   3) 仪表盘首页置顶注入「组网总览」卡片。
 *
 * 数据来源：/cgi-bin/luci/admin/mesh_api/summary（luci-app-fwx-mesh 提供）
 */
'use strict';
'require baseclass';

return baseclass.extend({
	__init__() {
		this.waitFor(() => document.querySelector('.top-navbar-brand'), (el) => this.patchBrand(el));
		this.waitFor(() => document.querySelector('.sidebar_brand'), (el) => this.patchBrand(el));
		this.waitFor(() => this.findMeshMenu(), (li) => this.promoteMeshMenu(li));
		this.waitFor(() => this.isDashboard() && document.querySelector('#maincontent'), () => this.renderMeshBanner());
	},

	/* 轮询 + MutationObserver：元素出现后执行一次 */
	waitFor(fn, cb) {
		let tries = 0;
		const tick = () => {
			const r = fn();
			if (!r)
				return false;
			cb(r);
			return true;
		};

		if (tick())
			return;

		const obs = new MutationObserver(() => {
			if (tick())
				obs.disconnect();
		});
		obs.observe(document.body, { childList: true, subtree: true });

		const timer = setInterval(() => {
			if (tick() || ++tries > 60) {
				clearInterval(timer);
				obs.disconnect();
			}
		}, 250);
	},

	patchBrand(el) {
		el.setAttribute('href', L.url('admin', 'mesh', 'management', 'home'));
		el.addEventListener('click', () => localStorage.setItem('luci-menu-category', 'basic'));
	},

	findMeshMenu() {
		const items = document.querySelectorAll('#topmenu > li');
		for (const li of items) {
			if (li.querySelector('a[href*="/admin/mesh"]'))
				return li;
		}
		return null;
	},

	promoteMeshMenu(li) {
		const menu = li.parentNode;
		if (menu.firstChild !== li)
			menu.insertBefore(li, menu.firstChild);

		li.classList.remove('menu-item-advanced');
		li.classList.add('menu-item-basic');

		const link = li.querySelector('a.menu') || li.querySelector('a');
		if (link) {
			Array.from(link.classList)
				.filter((c) => c.startsWith('menu-icon-'))
				.forEach((c) => link.classList.remove(c));
			link.classList.add('menu-icon-fwx_wireless');
		}

		const category = localStorage.getItem('luci-menu-category') || 'basic';
		li.hidden = (category !== 'basic');
	},

	isDashboard() {
		return ((L.env.dispatchpath || []).join('/') === 'admin/fwx_dashboard');
	},

	renderMeshBanner() {
		if (document.getElementById('mesh-overview-card'))
			return;

		const main = document.querySelector('#maincontent');
		if (!main)
			return;

		const card = E('div', { 'class': 'mesh-ov-card', 'id': 'mesh-overview-card' }, [
			E('div', { 'class': 'mesh-ov-head' }, [
				E('div', { 'class': 'mesh-ov-title' }, [
					E('span', { 'class': 'mesh-ov-dot off', 'id': 'mesh-ov-dot' }),
					E('span', {}, [ _('Mesh 组网') ])
				]),
				E('a', {
					'class': 'mesh-ov-link',
					'href': L.url('admin', 'mesh', 'management', 'home')
				}, [ _('进入组网管理') + ' →' ])
			]),
			E('div', { 'class': 'mesh-ov-body', 'id': 'mesh-ov-body' }, [
				E('div', { 'class': 'mesh-ov-empty' }, [ _('正在读取组网状态…') ])
			])
		]);

		main.insertBefore(card, main.firstChild);
		this.hydrateMeshCard();
	},

	hydrateMeshCard() {
		const role_label = {
			cap: '主节点',
			sap: '子节点',
			unconfigured: '未配置',
			unavailable: '服务未运行'
		};

		const fmt_uptime = (sec) => {
			sec = parseInt(sec, 10) || 0;
			if (sec <= 0)
				return '—';
			const d = Math.floor(sec / 86400);
			const h = Math.floor((sec % 86400) / 3600);
			const m = Math.floor((sec % 3600) / 60);
			if (d > 0)
				return d + ' 天 ' + h + ' 小时';
			if (h > 0)
				return h + ' 小时 ' + m + ' 分';
			return m + ' 分';
		};

		const render_body = (d) => {
			const body = document.getElementById('mesh-ov-body');
			if (!body)
				return;

			if (!d || !d.ok) {
				body.replaceChildren(E('div', { 'class': 'mesh-ov-empty' }, [ _('组网服务暂不可用') ]));
				return;
			}

			const items = [
				[ '角色', role_label[d.role] || d.role || '未知' ],
				[ '在线节点', (d.peers_online || 0) + ' / ' + (d.peers_total || 0) ],
				[ '接入终端', (d.clients_total || 0) + ' 台' ],
				[ '运行时长', fmt_uptime(d.uptime) ]
			];

			const grid = E('div', { 'class': 'mesh-ov-grid' }, items.map((item) =>
				E('div', { 'class': 'mesh-ov-item' }, [
					E('span', { 'class': 'mesh-ov-k' }, [ _(item[0]) ]),
					E('span', { 'class': 'mesh-ov-v' }, [ item[1] ])
				])
			));

			const nodes = Array.isArray(d.aps) ? d.aps : [];
			const children = [ grid ];

			if (nodes.length) {
				const chips = nodes.slice(0, 8).map((a) =>
					E('span', {
						'class': 'mesh-ov-ap' + (a.online ? '' : ' off')
					}, [ a.name || a.mac || 'AP' ])
				);

				children.push(E('div', { 'class': 'mesh-ov-aps' },
					[ E('span', { 'class': 'mesh-ov-k' }, [ _('节点') ]) ].concat(chips)));
			}

			body.replaceChildren.apply(body, children);
		};

		const load = () => {
			const req = new XMLHttpRequest();
			req.open('GET', L.url('admin', 'mesh_api', 'summary'), true);
			req.onload = () => {
				let d = null;
				try {
					d = JSON.parse(req.responseText);
				} catch (e) {
					d = null;
				}
				const dot = document.getElementById('mesh-ov-dot');
				if (dot)
					dot.className = 'mesh-ov-dot ' + (d && d.ok ? 'ok' : 'off');
				render_body(d);
			};
			req.onerror = () => render_body(null);
			req.send();
		};

		load();
		if (this._meshTimer)
			clearInterval(this._meshTimer);
		this._meshTimer = setInterval(load, 15000);
	}
});
