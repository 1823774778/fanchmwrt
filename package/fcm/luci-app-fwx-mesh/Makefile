#
# FanchmWrt mesh glue layer for wifiroam
#
# This is free software, licensed under the GNU General Public License v2.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=FanchmWrt mesh overview glue for wifiroam
LUCI_DESCRIPTION:=Aggregated mesh summary API and dashboard/home page integration for the wifiroam 802.11k/v/r suite
LUCI_DEPENDS:=+luci-compat +luci-app-wifiroam
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-or-later

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
