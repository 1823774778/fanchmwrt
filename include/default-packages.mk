ifneq ($(CONFIG_USE_APK),)
  DEFAULT_PACKAGES += apk-mbedtls
else
  DEFAULT_PACKAGES += opkg
endif

# FanchmWrt: Mesh 组网（wifiroam + LuCI 前端 + 固件层胶水包）
DEFAULT_PACKAGES += wifiroam luci-app-wifiroam luci-i18n-wifiroam-zh-cn luci-app-fwx-mesh
