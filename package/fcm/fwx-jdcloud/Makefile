include $(TOPDIR)/rules.mk

PKG_NAME:=fwx-jdcloud
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=FanchmWrt

include $(INCLUDE_DIR)/package.mk

define Package/fwx-jdcloud
  SECTION:=base
  CATEGORY:=Base system
  TITLE:=JDCloud RE-SS-01 / RE-CS-02 board glue
  DEPENDS:=@TARGET_qualcommax_ipq60xx
  PKGARCH:=all
endef

define Package/fwx-jdcloud/description
  First-boot network glue for JDCloud RE-SS-01 (亚瑟 AX1800 Pro)
  and RE-CS-02 (雅典娜 AX6600).
endef

define Build/Compile
endef

define Package/fwx-jdcloud/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/95-jdcloud-network $(1)/etc/uci-defaults/95-jdcloud-network
endef

$(eval $(call BuildPackage,fwx-jdcloud))
