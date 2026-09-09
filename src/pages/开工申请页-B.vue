<template>
  <div class="detail-page">
    <!-- 固定顶栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <a-button type="text" class="back-btn" @click="emit('back')">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="props.editId ? `修改开工申请-${detail.projectName}` : `开工申请-${detail.projectName}`">
          <span class="detail-title">{{ props.editId ? `修改开工申请-${detail.projectName}` : `开工申请-${detail.projectName}` }}</span>
        </a-tooltip>
        <a-tag color="green">开工</a-tag>
        <a-tag :color="STATUS_COLOR[detail.filingStatus]">
          {{ STATUS_LABEL[detail.filingStatus] }}
        </a-tag>
        <span class="detail-header-meta">
          <span class="detail-header-meta-item">{{ detail.stationType }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.policyType === 'nonstandard' ? PROJECT_TYPE_LABEL[detail.projectType] : '公建 EMC' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.initData?.policyType === 'nonstandard' ? '非标政策' : '标准政策' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ detail.stationNo }}<CopyOutlined class="copy-icon" @click="copyStationNo(detail.stationNo)" /></span>
        </span>
      </div>
      <a-space>
        <a-popconfirm
          title="确认作废该开工申请？"
          ok-text="确认作废" ok-type="danger" cancel-text="取消"
          @confirm="handleVoid"
        >
          <a-button v-if="canVoid" danger>作废</a-button>
        </a-popconfirm>
        <a-button @click="emit('back')">取消</a-button>
        <a-button :loading="saving" @click="handleSave">保存</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交开工申请</a-button>
      </a-space>
    </div>

    <div ref="detailBodyRef" class="detail-body" :style="scrollPad > 0 ? { paddingBottom: scrollPad + 'px' } : {}">
      <!-- 左侧：只读 TAB 内容 -->
      <div class="detail-main">

        <!-- 退回原因卡片（仅开工审核不通过时展示） -->
        <RejectCard v-if="detail.filingStatus === 'start_rejected'" :info="rejectInfo" :title="STATUS_LABEL[detail.filingStatus]" />

        <!-- ── 项目信息 ── -->
        <div class="detail-card detail-card--plain">
          <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: !projectInfoOpen }" /></div>
          <div v-show="projectInfoOpen">

          <!-- 标准政策布局 -->
          <template v-if="props.policyType !== 'nonstandard'">
            <div class="info-section" style="margin-top:0">
              <div class="info-section-title">基本信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">电站类型</span><span class="info-value">{{ detail.stationType }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ '公建 EMC' }}</span></div>
                <div class="info-item"><span class="info-label">匹配政策</span><span class="info-value">标准政策</span></div>
                <div class="info-item"><span class="info-label">所属区域公司</span><span class="info-value">{{ detail.regionCompany }}</span></div>
                <div class="info-item"><span class="info-label">项目地址</span><span class="info-value">{{ detail.region.join(' / ') }}</span></div>
                <div class="info-item"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail }}</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">供应商信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">监理商名称</span><span class="info-value">{{ detail.supervisorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">设计商名称</span><span class="info-value">{{ detail.designerName || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">合同信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div v-if="detail.projectType === 'public_emc'" class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section" style="border-top: none; padding-top: 0">
              <div class="info-grid">
                <div class="info-item info-item--span2"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">营业执照/组织机构代码证</span><span class="info-value"><FileAttachmentView v-if="detail.bizLicense?.length" :files="detail.bizLicense" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">开户许可证</span><span class="info-value"><FileAttachmentView v-if="detail.bankAccountCert" :files="[detail.bankAccountCert]" /><span v-else>—</span></span></div>
                <div class="info-item" style="grid-column-start:1"><span class="info-label">法定代表人身份证正面</span><div class="id-card-img id-card-img--front" v-if="detail.idCardFront" /><span v-else>—</span></div>
                <div class="info-item"><span class="info-label">法定代表人身份证反面</span><div class="id-card-img id-card-img--back" v-if="detail.idCardBack" /><span v-else>—</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">项目产权信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">项目公司</span><span class="info-value">{{ detail.projectCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EPC 公司</span><span class="info-value">{{ detail.epcCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">产权公司</span><span class="info-value">{{ detail.ownershipCompany || '—' }}</span></div>
              </div>
            </div>
          </template>

          <!-- 非标政策布局（平铺，无子标题） -->
          <template v-else>
            <div class="info-section" style="margin-top:0">
              <div class="info-grid">
                <div class="info-item"><span class="info-label">OA编号</span><span class="info-value">{{ detail.oaNo || '—' }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ PROJECT_TYPE_LABEL[detail.projectType] }}</span></div>
                <div class="info-item"><span class="info-label">是否政策匹配</span><span class="info-value">否</span></div>
                <div class="info-item"><span class="info-label">省市区</span><span class="info-value">{{ detail.region?.join(' / ') || '—' }}</span></div>
                <div class="info-item info-item--span2"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
                <div class="info-item info-item--span2" style="grid-column-start:1"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
              </div>
            </div>
          </template>
          </div>
        </div>


        <div ref="tabsWrapperRef" class="tabs-wrapper" :class="{ 'tabs-stuck': tabsStuck }">
          <a-tabs
            v-model:active-key="activeTab"
            class="detail-tabs"
            :tab-bar-style="{ padding: tabsStuck ? '0 24px' : '8px 24px 0', marginBottom: 0 }"
            @tab-click="scrollToTabNav"
          >
            <!-- ──────── 勘察 TAB ──────── -->
            <a-tab-pane key="survey" tab="勘察">
              <div class="tab-body">

                <!-- 项目总体概况 -->
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">项目总体概况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">建筑数量</span>
                      <span class="info-value">{{ detail.buildingCount != null ? detail.buildingCount + ' 个' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">屋面类型</span>
                      <span class="info-value">
                        <template v-if="detail.roofLightSteel || detail.roofConcrete || detail.roofOther">
                          <span v-if="detail.roofLightSteel">轻钢结构屋面 {{ detail.roofLightSteel }} 个</span>
                          <span v-if="detail.roofLightSteel && detail.roofConcrete">　</span>
                          <span v-if="detail.roofConcrete">混凝土屋面 {{ detail.roofConcrete }} 个</span>
                          <span v-if="(detail.roofLightSteel || detail.roofConcrete) && detail.roofOther">　</span>
                          <span v-if="detail.roofOther">其他 {{ detail.roofOther }} 个</span>
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">总平面布置图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.siteLayoutFiles?.length" :files="detail.siteLayoutFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 每个建筑的屋面情况 -->
                <div class="info-section">
                  <div class="info-section-title">每个建筑的屋面情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">彩钢瓦瓦型</span>
                      <span class="info-value">{{ STEEL_ROOF_LABEL[detail.steelRoofType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">瓦面锈蚀情况</span>
                      <span class="info-value">{{ RUST_LABEL[detail.rustCondition] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有障碍物</span>
                      <span class="info-value">
                        <template v-if="detail.hasObstacle === 'yes'">有，高 {{ detail.obstacleHeight }}m / 宽 {{ detail.obstacleWidth }}m</template>
                        <template v-else-if="detail.hasObstacle === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有采光带</span>
                      <span class="info-value">
                        <template v-if="detail.hasSkylight === 'yes'">有，采光带宽度 {{ detail.skylightWidth }}mm</template>
                        <template v-else-if="detail.hasSkylight === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 用户配电情况 -->
                <div class="info-section">
                  <div class="info-section-title">用户配电情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">进线电压等级</span>
                      <span class="info-value">{{ detail.inletVoltage != null ? detail.inletVoltage + ' kV' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户进线接入方式</span>
                      <span class="info-value">{{ INLET_CONN_LABEL[detail.inletConnectionType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线回路数</span>
                      <span class="info-value">{{ detail.circuitCount != null ? detail.circuitCount + ' 回' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线电缆规格</span>
                      <span class="info-value">{{ detail.cableSpec != null ? detail.cableSpec + ' mm²' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户变压器</span>
                      <span class="info-value">{{ detail.transformerCount != null ? detail.transformerCount + ' 台，共 ' + detail.transformerKVA + ' kVA' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">是否具备接入间隔</span>
                      <span class="info-value">{{ INTERVAL_LABEL[detail.hasInterval] || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 光伏设备放置及布线条件 -->
                <div class="info-section">
                  <div class="info-section-title">光伏设备放置及布线条件</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">光伏设备放置条件</span>
                      <span class="info-value">
                        <template v-if="detail.hasIndoorSpace === 'yes'">有室内空间，{{ detail.indoorLength }}m × {{ detail.indoorWidth }}m</template>
                        <template v-else-if="detail.hasIndoorSpace === 'no'">无室内放置空间</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">场内电缆管道情况</span>
                      <span class="info-value">{{ CABLE_PIPE_LABEL[detail.hasCablePipe] || '—' }}{{ detail.hasCablePipe === 'yes' && detail.cablePipeType ? '（' + CABLE_TYPE_LABEL[detail.cablePipeType] + '）' : '' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 勘察照片 -->
                <div class="info-section">
                  <div class="info-section-title">勘察照片</div>
                  <a-row :gutter="[24, 16]">
                    <a-col v-for="cat in PHOTO_CATEGORIES" :key="cat.key" :span="12">
                      <div class="photo-readonly-col">
                        <span class="photo-readonly-label">{{ cat.label }}</span>
                        <div class="photo-readonly-imgs">
                          <template v-if="detail.photos[cat.key]?.length">
                            <a-image v-for="(img, i) in detail.photos[cat.key]" :key="i" :src="img"
                              :width="80" :height="80" style="object-fit:cover;border-radius:4px" />
                          </template>
                          <span v-else class="empty-hint">—</span>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>

                <!-- 项目图纸及用电情况 -->
                <div class="info-section">
                  <div class="info-section-title">项目图纸及用电情况</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">图纸</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.drawingFiles?.length" :files="detail.drawingFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">用电情况</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricityFiles?.length" :files="detail.electricityFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 接入批复 -->
                <div class="info-section">
                  <div class="info-section-title">接入批复</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">接入批复</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.approvalFiles?.length" :files="detail.approvalFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </a-tab-pane>

            <!-- ──────── 设计 TAB ──────── -->
            <a-tab-pane key="design" tab="设计">
              <div class="tab-body tab-body--design">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">甲供 BOM</div>
                  <a-table :columns="jiagongReadonlyColumns" :data-source="detail.jiagongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无甲供物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">乙供中高/低压 BOM</div>
                  <a-table :columns="yigongReadonlyColumns" :data-source="detail.yigongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无乙供中/低压物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">上网模式</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">上网模式</span>
                      <span class="info-value">{{ GRID_MODE_LABEL[detail.gridMode] || '—' }}</span>
                    </div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title" style="margin-bottom:8px">应用场景</div>
                  <div style="font-size:14px;color:rgba(0,0,0,0.65);margin-bottom:12px">
                    应用场景是否混装 {{ detail.scenes.length > 1 ? '是' : '否' }}
                  </div>
                  <a-table
                    :columns="sceneColumns"
                    :data-source="detail.scenes"
                    :pagination="false"
                    size="small"
                  />
                </div>
                <div class="info-section">
                  <div class="info-section-title">设计附件</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">设计资质</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.designQualFiles?.length" :files="detail.designQualFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">电气设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricalDesignFiles?.length" :files="detail.electricalDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">结构设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.structuralDesignFiles?.length" :files="detail.structuralDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">厂房结构安全性评估</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.safetyAssessFiles?.length" :files="detail.safetyAssessFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">其他附件</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.otherAttachFiles?.length" :files="detail.otherAttachFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 商务 TAB ──────── -->
            <a-tab-pane key="commercial" tab="商务">
              <div class="tab-body tab-body--commercial">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">合同信息</div>

                  <!-- EMC协议 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">EMC协议（能源管理合同）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.emcContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.emcContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.emcContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.emcContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.emcContract.amount != null ? detail.commercial.emcContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.emcContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.emcContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.emcContract.files?.length" :files="detail.commercial.emcContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 小E施工承包合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">小E施工承包合同（常规EMC）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.smallEContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.smallEContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.smallEContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.smallEContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.smallEContract.amount != null ? detail.commercial.smallEContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.smallEContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.smallEContract.remark || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerIdCard || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseIdCard || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.smallEContract.files?.length" :files="detail.commercial.smallEContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 设计合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">设计合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.designContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.designContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.designContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.designContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.designContract.amount != null ? detail.commercial.designContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.designContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.designContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.designContract.files?.length" :files="detail.commercial.designContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 监理合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">监理合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.jianliContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.jianliContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.jianliContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.jianliContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.jianliContract.amount != null ? detail.commercial.jianliContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.jianliContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.jianliContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.jianliContract.files?.length" :files="detail.commercial.jianliContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 其他合同 -->
                  <template v-if="detail.commercial.otherContracts?.length">
                    <div v-for="(c, idx) in detail.commercial.otherContracts" :key="idx" class="contract-block-ro">
                      <div class="contract-block-ro-header">其他合同{{ idx + 1 }}</div>
                      <div class="info-grid">
                        <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ c.contractNo || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ c.paymentCategory || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ c.partyA || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ c.partyB || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ c.amount != null ? c.amount + ' 元' : '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ c.signDate || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ c.remark || '—' }}</span></div>
                      </div>
                    </div>
                  </template>
                </div>

                <div v-if="props.policyType !== 'nonstandard'" class="info-section">
                  <div class="info-section-title">付款节点<span class="section-sub" style="margin-left:8px">标准政策自动匹配</span></div>
                  <div class="payment-nodes">
                    <div v-for="node in STANDARD_PAYMENT_NODES" :key="node.key" class="payment-node-row">
                      <span class="payment-node-label">{{ node.label }}</span>
                      <span class="payment-node-pct">{{ node.pct }}%</span>
                      <span class="payment-node-desc">{{ node.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 备案 TAB ──────── -->
            <a-tab-pane key="record" tab="备案">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">备案证信息</div>
                  <template v-if="detail.filingCert">
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">备案证文件名</span>
                        <span class="info-value">{{ detail.filingCert.fileName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案类型</span>
                        <span class="info-value">{{ detail.filingCert.filingType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目名称</span>
                        <span class="info-value">{{ detail.filingCert.projectName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目代码</span>
                        <span class="info-value">{{ detail.filingCert.projectCode }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">产权公司</span>
                        <span class="info-value">{{ detail.filingCert.ownershipCompany }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证编号</span>
                        <span class="info-value">{{ detail.filingCert.certNo }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证容量(W)</span>
                        <span class="info-value">{{ detail.filingCert.capacity }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证类型</span>
                        <span class="info-value">{{ detail.filingCert.certType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证批复时间</span>
                        <span class="info-value">{{ detail.filingCert.approvalDate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">发文机关</span>
                        <span class="info-value">{{ detail.filingCert.issuingAuthority }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证批复内容</span>
                        <span class="info-value">{{ detail.filingCert.approvalContent }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证附件</span>
                        <span class="info-value">
                          <FileAttachmentView v-if="detail.filingCert.attachmentName" :files="[detail.filingCert.attachmentName]" />
                          <span v-else>—</span>
                        </span>
                      </div>
                    </div>
                  </template>
                  <span v-else class="empty-hint">暂未关联备案证</span>
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="start" tab="开工" force-render>
              <a-form ref="startRef" :colon="false" :model="startForm" layout="vertical" style="padding: 40px 20px 40px">

                <!-- 开工信息 -->
                <div class="section-sub-title" style="margin-top:0">开工信息</div>
                <a-row :gutter="[24, 0]">
                  <a-col :span="6">
                    <a-form-item label="现场负责人" name="siteManager"
                      :rules="[{ required: true, message: '请输入现场负责人' }]">
                      <a-input v-model:value="startForm.siteManager" placeholder="请输入" :maxlength="30" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="负责人电话" name="siteManagerPhone"
                      :rules="[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
                      ]">
                      <a-input v-model:value="startForm.siteManagerPhone" placeholder="请输入" :maxlength="11" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="开工日期" name="startDate"
                      :rules="[{ required: true, message: '请选择开工日期' }]">
                      <a-date-picker v-model:value="startForm.startDate" style="width:100%" format="YYYY-MM-DD" placeholder="请选择" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider style="margin-top: 0" />

                <!-- 工程资料 -->
                <div class="section-sub-title" style="margin-top:0">工程资料</div>
                <a-row :gutter="[24, 0]">
                  <a-col :span="12">
                    <a-form-item name="insuranceFiles"
                      :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传中高压施工单位保险') }]">
                      <template #label>中高压施工单位保险<a-tooltip title="支持 PDF / JPG / PNG，单文件 ≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                      <FileUploadField v-model:file-list="startForm.insuranceFiles" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item name="safetyDisclosureFiles"
                      :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传质量安全技术交底') }]">
                      <template #label>质量安全技术交底<a-tooltip title="支持 PDF / JPG / PNG，单文件 ≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                      <FileUploadField v-model:file-list="startForm.safetyDisclosureFiles" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="[24, 0]">
                  <a-col :span="12">
                    <a-form-item label="其他">
                      <FileUploadField v-model:file-list="startForm.engineeringOtherFiles" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider style="margin-top: 0" />

                <!-- 技术资料 -->
                <div class="section-sub-title" style="margin-top:0">技术资料</div>
                <a-row :gutter="[24, 0]">
                  <a-col :span="12">
                    <a-form-item name="techDisclosureFiles"
                      :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传技术交底') }]">
                      <template #label>技术交底<a-tooltip title="支持 PDF / JPG / PNG，最多5个，单文件 ≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                      <FileUploadField v-model:file-list="startForm.techDisclosureFiles" :max-count="5" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="设备技术协议">
                      <FileUploadField v-model:file-list="startForm.equipmentAgreementFiles" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="[24, 0]">
                  <a-col :span="12">
                    <a-form-item label="其他">
                      <FileUploadField v-model:file-list="startForm.techOtherFiles" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider style="margin-top: 0" />

                <!-- 施工人员 -->
                <div class="section-header" style="margin-bottom: 12px">
                  <span class="section-sub-title" style="margin:0">施工人员</span>
                  <a-button size="small" @click="personnelModalOpen = true">
                    <template #icon><PlusOutlined /></template>添加人员
                  </a-button>
                </div>
                <a-table
                  :data-source="startForm.personnel"
                  :columns="personnelColumns"
                  :pagination="false"
                  size="small"
                  row-key="id"
                  :locale="{ emptyText: '暂无施工人员，点击「添加人员」选择' }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                      <a-button type="link" size="small" @click="message.info('跳转到人才详情页')">详情</a-button>
                      <a-button type="text" size="small" danger @click="removePersonnel(record.id)">删除</a-button>
                    </template>
                  </template>
                </a-table>

              </a-form>
            </a-tab-pane>

          </a-tabs>
        </div>
      </div>

    </div>
  </div>

  <!-- 添加施工人员弹窗 -->
  <a-modal
    v-model:open="personnelModalOpen"
    title="添加施工人员"
    :width="600"
    ok-text="确认选择"
    cancel-text="取消"
    destroy-on-close
    @ok="confirmPersonnel"
    @cancel="resetPersonnelModal"
  >
    <a-input-search
      v-model:value="personnelSearch"
      placeholder="按姓名搜索"
      style="width:100%;margin-bottom:12px"
    />
    <a-table
      :columns="candidateColumns"
      :data-source="filteredCandidates"
      :row-selection="{
        selectedRowKeys: selectedPersonnelKeys,
        onChange: onPersonnelSelect,
        getCheckboxProps: (record: any) => ({ disabled: startForm.personnel.some(p => p.id === record.id) }),
      }"
      :pagination="{ pageSize: 8 }"
      size="small"
      row-key="id"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import FileAttachmentView from '../components/FileAttachmentView.vue'
import RejectCard from '../components/RejectCard.vue'
import FileUploadField from '../components/FileUploadField.vue'
import {
  LeftOutlined, CalendarOutlined, CopyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FileAddOutlined,
  AuditOutlined, HolderOutlined, DownOutlined,
  UploadOutlined, QuestionCircleOutlined, PlusOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{ editId?: string | null; initStatus?: string | null; initData?: Record<string, any> | null }>()
const emit = defineEmits<{ back: [] }>()

const projectInfoOpen = ref(false)

function copyStationNo(no: string) {
  navigator.clipboard.writeText(no).then(() => message.success('已复制'))
}

// ── 开工 tab 表单 ──
const startRef  = ref()
const startForm = reactive({
  siteManager:            '',
  siteManagerPhone:       '',
  startDate:              null as any,
  insuranceFiles:         [] as any[],
  safetyDisclosureFiles:  [] as any[],
  engineeringOtherFiles:  [] as any[],
  techDisclosureFiles:    [] as any[],
  equipmentAgreementFiles:[] as any[],
  techOtherFiles:         [] as any[],
  personnel:              [] as Array<{ id: string; name: string; position: string; phone: string }>,
})
const personnelColumns = [
  { title: '序号',   key: 'index',      width: 60,  customRender: ({ index }: any) => index + 1 },
  { title: '姓名',   dataIndex: 'name',     key: 'name' },
  { title: '岗位',   dataIndex: 'position', key: 'position' },
  { title: '手机号', dataIndex: 'phone',    key: 'phone' },
  { title: '操作',   key: 'action',         width: 120 },
]
const candidateColumns = [
  { title: '姓名', dataIndex: 'name',     key: 'name' },
  { title: '岗位', dataIndex: 'position', key: 'position' },
  { title: '手机', dataIndex: 'phone',    key: 'phone' },
]

const mockCandidates = [
  { id: 'p1', name: '张建国', position: '施工队长',   phone: '13812340001' },
  { id: 'p2', name: '李明',   position: '电工',       phone: '13812340002' },
  { id: 'p3', name: '王强',   position: '焊工',       phone: '13812340003' },
  { id: 'p4', name: '赵磊',   position: '安装工',     phone: '13812340004' },
  { id: 'p5', name: '陈伟',   position: '监理工程师', phone: '13812340005' },
  { id: 'p6', name: '孙浩',   position: '施工员',     phone: '13812340006' },
]

const personnelModalOpen    = ref(false)
const personnelSearch       = ref('')
const selectedPersonnelKeys = ref<string[]>([])
const selectedPersonnelRows = ref<typeof mockCandidates>([])

const filteredCandidates = computed(() =>
  personnelSearch.value.trim()
    ? mockCandidates.filter(c => c.name.includes(personnelSearch.value.trim()))
    : mockCandidates
)

function onPersonnelSelect(keys: any[]) {
  selectedPersonnelKeys.value = keys
}

function confirmPersonnel() {
  selectedPersonnelKeys.value.forEach(key => {
    const record = mockCandidates.find(c => c.id === key)
    if (record && !startForm.personnel.some(p => p.id === record.id)) {
      startForm.personnel.push(record)
    }
  })
  resetPersonnelModal()
}

function resetPersonnelModal() {
  personnelModalOpen.value    = false
  personnelSearch.value       = ''
  selectedPersonnelKeys.value = []
  selectedPersonnelRows.value = []
}

function removePersonnel(id: string) {
  startForm.personnel = startForm.personnel.filter(p => p.id !== id)
}

const detailBodyRef   = ref<HTMLElement | null>(null)
const tabsWrapperRef  = ref<HTMLElement | null>(null)
const tabsStuck       = ref(false)
const scrollPad       = ref(0)

async function scrollToTabNav() {
  // ① 等新 tab 内容渲染完，再量尺寸
  await nextTick()

  const body    = detailBodyRef.value
  const wrapper = tabsWrapperRef.value
  if (!body || !wrapper) return

  // ② 提前锁定 stuck 状态，等 tab-bar 高度稳定后再量 target
  tabsStuck.value = true
  await nextTick()

  const target = Math.round(
    wrapper.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
  )

  // ③ 用"去掉当前 scrollPad 的真实内容高"算需要多少 pad
  //    原公式 depth = scrollHeight - clientHeight 当内容比 viewport 矮时是负数，算出的 pad 不够
  //    正确：需要 scrollHeight + neededPad - clientHeight >= target
  //         → neededPad >= target - naturalScrollHeight + clientHeight
  const naturalScrollHeight = body.scrollHeight - scrollPad.value
  const neededPad = Math.max(0, target - naturalScrollHeight + body.clientHeight + 20)

  if (neededPad !== scrollPad.value) {
    scrollPad.value = neededPad
    await nextTick()
  }

  body.scrollTop = target
}

let _scrollHandler: (() => void) | null = null
onMounted(() => {
  _scrollHandler = () => {
    const body    = detailBodyRef.value
    const wrapper = tabsWrapperRef.value
    if (!body || !wrapper) return
    tabsStuck.value = wrapper.getBoundingClientRect().top <= body.getBoundingClientRect().top + 1
    if (!tabsStuck.value && body.scrollTop <= 1) scrollPad.value = 0
  }
  detailBodyRef.value?.addEventListener('scroll', _scrollHandler, { passive: true })
})
onBeforeUnmount(() => {
  if (_scrollHandler) detailBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})

const saving = ref(false)
const submitting = ref(false)
async function handleSave() {
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  saving.value = false
  message.success('保存成功')
}
async function handleSubmit() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 600))
  submitting.value = false
  message.success('开工申请已提交')
  emit('back')
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  waiting_start: 'default', applying_start: 'processing', start_rejected: 'error', started: 'success',
}
const STATUS_LABEL: Record<string, string> = {
  waiting_start: '待开工', applying_start: '开工审核中', start_rejected: '开工审核不通过', started: '已开工',
}
const REJECT_INFO_MAP: Record<string, { stage: string; reviewer: string; time: string; reason?: string; images?: string[]; sections?: { title: string; reason: string; images?: string[] }[] }> = {
  start_rejected: {
    stage: '开工审核', reviewer: '审核组（安能）', time: '2026-08-13 16:30',
    sections: [
      { title: '商务审核不通过', reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。' },
      { title: '工程审核不通过', reason: '施工现场条件不符合开工要求，需重新进行现场勘察并整改后再提交。' },
    ],
  },
}
const rejectInfo = computed(() => REJECT_INFO_MAP[detail.value.filingStatus] ?? detail.value.rejectInfo)
const PROJECT_TYPE_LABEL: Record<string, string> = { emc: '常规 EMC', public_emc: '公建 EMC' }
const GRID_VOLTAGE_LABEL: Record<string, string> = { low: '低压', high: '中高压' }
const PUBLIC_BUILD_TYPE_LABEL: Record<string, string> = {
  education:    '科教文体公建',
  medical:      '医疗卫生公建',
  government:   '党政政务机构',
  enforcement:  '执法监管机构',
  public_welfare:'公益事业单位机构',
  other:        '其他',
}
const GRID_MODE_LABEL: Record<string, string> = {
  full: '全额上网', surplus: '余电上网',
  surplus_no_grid: '余电不上网', offgrid: '离网',
}
const STEEL_ROOF_LABEL: Record<string, string> = {
  standing_seam: '直立锁边型', angle_drive: '角驰型', trapezoidal: '梯型',
}
const RUST_LABEL: Record<string, string> = {
  none: '无锈蚀', light: '局部轻度锈蚀', severe: '严重锈蚀',
}
const INLET_CONN_LABEL: Record<string, string> = {
  dedicated: '专线接入', tee: 'T接接入',
}
const INTERVAL_LABEL: Record<string, string> = {
  yes: '有，需落实备用间隔是否可给光伏',
  space: '无，但有安装间隔的空间',
  no: '无',
}
const CABLE_PIPE_LABEL: Record<string, string> = {
  yes: '有', no_green: '无，有绿化带可直埋', no_road: '无，需破场内硬化道路',
}
const CABLE_TYPE_LABEL: Record<string, string> = {
  trench: '电缆沟', conduit: '电缆排管', other: '其它',
}
const LOG_ICON: Record<string, any> = {
  create:  FileAddOutlined,
  submit:  CheckCircleOutlined,
  reject:  CloseCircleOutlined,
  approve: CheckCircleOutlined,
  void:    EditOutlined,
}
const LOG_TAG_LABEL: Record<string, string> = {
  create:  '创建',
  submit:  '已提交',
  reject:  '不通过',
  approve: '已通过',
  void:    '已作废',
}
const PHOTO_CATEGORIES = [
  { key: 'exterior', label: '外观照片' },
  { key: 'roof',     label: '屋顶照片' },
  { key: 'meter',    label: '电表照片' },
  { key: 'inverter', label: '逆变器位置' },
  { key: 'other',    label: '其他' },
]
const STANDARD_PAYMENT_NODES = [
  { key: 'start',    label: '开工款',    pct: 30, desc: '开工验收后 15 个工作日内到账' },
  { key: 'grid',     label: '并网款',    pct: 30, desc: '并网验收后 15 个工作日内到账' },
  { key: 'complete', label: '竣工验收款', pct: 30, desc: '竣工验收后 15 个工作日内到账' },
  { key: 'warranty', label: '质保金',    pct: 10, desc: '质保期满后 30 个工作日内到账' },
]

// ─── mock 数据（接入时替换为接口返回） ───────────────────────────────────────

const detail = ref({
  id: 'LNC-2026-0001',
  filingStatus: (props.initData?.filingStatus ?? props.initStatus ?? 'waiting_start') as string,
  // 系统信息
  stationType: '工商业',
  stationNo:   props.initData?.stationNo ?? 'LNC-2026-0001',
  // 基本信息
  oaNo: 'A304202607100012',
  projectName: props.initData?.projectName ?? '杭州市滨江区某商业综合体光伏项目',
  projectType: 'emc',
  policyMatched: true,
  division: '安能智电事业部',
  regionCompany: '浙江区域公司',
  region: ['浙江省', '杭州市', '滨江区'],
  addressDetail: '××路×号商业综合体楼顶',
  capacity: 320,
  gridVoltage: 'low',
  // 代理商信息
  agentName: props.initData?.agentName ?? '浙江绿能科技有限公司',
  // 用电企业信息
  userEntName:    '杭州某商业综合体管理有限公司',
  propertyProof:  ['产权证明.pdf'],
  bizLicense:     ['营业执照.pdf'],
  bankAccountCert:'开户许可证.pdf',
  idCardFront:    '身份证正面.jpg',
  idCardBack:     '身份证反面.jpg',
  // 供应商信息
  developerName:   '浙江华电开发有限公司',
  constructorName: '杭州建工集团有限公司',
  supervisorName:  '浙江工程监理有限公司',
  designerName:    '',
  // 合同信息
  emcPrice:        0.6500,
  emcYears:        20,
  consumptionRate: 85,
  // 公建信息（仅 public_emc）
  publicBuildType: null as string | null,
  // 项目产权信息
  projectCompany:   '杭州光伏资产管理有限公司',
  epcCompany:       '杭州安能智电 EPC 有限公司',
  ownershipCompany: '杭州光伏资产管理有限公司',
  // 商务
  commercial: {
    emcContract:    { contractNo: 'EMC-2026-0001', paymentCategory: '应收款项', partyA: '浙江某甲供应商有限公司', partyB: '杭州光伏资产管理有限公司', amount: 1200000, signDate: '2026-03-20', remark: '', files: ['EMC协议.pdf'] },
    smallEContract: { contractNo: 'XE-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '杭州建工集团有限公司', amount: 800000, signDate: '2026-03-22', remark: '', files: ['小E施工合同.pdf'], controllerName: '李四', controllerIdCard: '330102199001011234', controllerSpouseName: '王五', controllerSpouseIdCard: '330102199203021234' },
    designContract: { contractNo: 'DS-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '浙江华电开发有限公司', amount: 50000, signDate: '2026-03-25', remark: '', files: [] },
    jianliContract: { contractNo: 'JL-2026-0001', paymentCategory: '应付款项', partyA: '杭州光伏资产管理有限公司', partyB: '浙江工程监理有限公司', amount: 30000, signDate: '2026-03-28', remark: '', files: [] },
    otherContracts: [],
  },
  // 勘察
  gridMode: 'surplus',
  buildingCount: 3,
  roofLightSteel: 2,
  roofConcrete: 1,
  roofOther: 0,
  siteLayoutFiles: ['总平面布置图.pdf'],
  steelRoofType: 'standing_seam',
  rustCondition: 'light',
  hasObstacle: 'no',
  obstacleHeight: null as number | null,
  obstacleWidth: null as number | null,
  hasSkylight: 'yes',
  skylightWidth: 200,
  inletVoltage: 10,
  inletConnectionType: 'dedicated',
  circuitCount: 2,
  cableSpec: 150,
  transformerCount: 3,
  transformerKVA: 1200,
  hasInterval: 'yes',
  hasIndoorSpace: 'yes',
  indoorLength: 6.5,
  indoorWidth: 4.0,
  hasCablePipe: 'yes',
  cablePipeType: 'trench',
  drawingFiles: ['项目图纸.dwg'],
  electricityFiles: ['用电情况报告.pdf'],
  approvalFiles: ['接入批复文件.pdf'],
  scenes: [
    { type: '屋顶', blocks: 560, tiltAngle: 10, specialPlan: null },
    { type: '车棚', blocks: 220, tiltAngle: 5,  specialPlan: null },
  ],
  photos: {
    exterior: Array.from({ length: 10 }, (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    roof:     Array.from({ length: 4 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    meter:    Array.from({ length: 2 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    inverter: Array.from({ length: 3 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    other:    [],
  },
  jiagongBom: [
    { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', quantity: 560 },
    { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', quantity: 8 },
  ],
  yigongBom: [
    { code: 'TB0002', name: '400kVA柱上变压器', type: '中高压', unit: '台', quantity: 2 },
    { code: 'TJ0080', name: '台架变',           type: '低压',   unit: '台', quantity: 1 },
  ],
  designQualFiles: ['设计资质证书.pdf'],
  electricalDesignFiles: ['电气设计图.dwg'],
  structuralDesignFiles: ['结构设计图.dwg'],
  safetyAssessFiles: [],
  otherAttachFiles: [],
  filingCert: {
    fileName: '杭州滨江综合体光伏备案证',
    filingType: '备案',
    projectName: '杭州市滨江区某商业综合体光伏项目',
    projectCode: 'PJ-2026-0001',
    ownershipCompany: '杭州光伏资产管理有限公司',
    certNo: 'BC-2026-0001',
    capacity: 320000,
    certType: '分布式光伏',
    approvalDate: '2026-03-15',
    issuingAuthority: '杭州市滨江区发展和改革局',
    approvalContent: '同意该项目在滨江区××路×号商业综合体楼顶建设分布式光伏发电项目，装机容量320kW，接入10kV电网。',
    attachmentName: '杭州滨江综合体光伏备案批复文件.pdf',
  },
  rejectInfo: {
    stage: '开工审核',
    reviewer: '李四（审核员）',
    time: '2026-08-11 15:30',
    reason: '施工方案不完整，请补充安全施工方案及施工队资质证明材料。',
    images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2I4YzhkOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2M4YjhjOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2M4YzhiOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+'],
  },
  logs: [] as { id: number; type: string; event: string; operator: string; time: string; note: string | null }[],
})

watch(() => props.initStatus, (val) => {
  if (val) detail.value.filingStatus = val
})

// ─── 状态对应的流转日志 ───────────────────────────────────────────────────────

const LOGS_BY_STATUS: Record<string, typeof detail.value.logs> = {
  filing: [
    { id: 2, type: 'create', event: '保存草稿', operator: '张三（代理商）', time: '2026-08-10 14:05', note: null },
    { id: 1, type: 'create', event: '创建建档', operator: '张三（代理商）', time: '2026-08-10 09:32', note: null },
  ],
  pending_review: [
    { id: 3, type: 'submit', event: '提交建档',  operator: '张三（代理商）', time: '2026-08-10 17:20', note: null },
    { id: 2, type: 'create', event: '保存草稿',  operator: '张三（代理商）', time: '2026-08-10 14:05', note: null },
    { id: 1, type: 'create', event: '创建建档',  operator: '张三（代理商）', time: '2026-08-10 09:32', note: null },
  ],
  rejected: [
    { id: 4, type: 'reject', event: '审核不通过', operator: '李四（审核员）', time: '2026-08-11 15:30', note: '商务信息有误，请修改后重新提交' },
    { id: 3, type: 'submit', event: '提交建档',   operator: '张三（代理商）', time: '2026-08-10 17:20', note: null },
    { id: 2, type: 'create', event: '保存草稿',   operator: '张三（代理商）', time: '2026-08-10 14:05', note: null },
    { id: 1, type: 'create', event: '创建建档',   operator: '张三（代理商）', time: '2026-08-10 09:32', note: null },
  ],
  start_rejected: [
    { id: 5, type: 'reject', event: '开工审核不通过', operator: '审核组（安能）', time: '2026-08-13 16:30', note: '【商务】EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。\n【工程】施工现场条件不符合开工要求，需重新进行现场勘察并整改后再提交。' },
    { id: 4, type: 'submit', event: '提交开工申请',   operator: '张三（代理商）',   time: '2026-08-10 17:20', note: null },
    { id: 3, type: 'create', event: '保存草稿',       operator: '张三（代理商）',   time: '2026-08-10 14:05', note: null },
    { id: 2, type: 'create', event: '创建开工申请',   operator: '张三（代理商）',   time: '2026-08-10 09:32', note: null },
    { id: 1, type: 'approve', event: '建档审核通过',  operator: '李四（安能审核员）', time: '2026-08-09 11:00', note: null },
  ],
  approved: [
    { id: 4, type: 'approve', event: '审核通过', operator: '李四（审核员）', time: '2026-08-11 10:00', note: null },
    { id: 3, type: 'submit',  event: '提交建档', operator: '张三（代理商）', time: '2026-08-10 17:20', note: null },
    { id: 2, type: 'create',  event: '保存草稿', operator: '张三（代理商）', time: '2026-08-10 14:05', note: null },
    { id: 1, type: 'create',  event: '创建建档', operator: '张三（代理商）', time: '2026-08-10 09:32', note: null },
  ],
}

// ─── 日志分组 ─────────────────────────────────────────────────────────────────

const groupedLogs = computed(() => {
  const logs = LOGS_BY_STATUS[detail.value.filingStatus] ?? []
  const map = new Map<string, typeof logs>()
  for (const log of logs) {
    const date = log.time.split(' ')[0]
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(log)
  }
  return Array.from(map.entries()).map(([date, logs]) => ({ date, logs }))
})

// ─── 权限 ────────────────────────────────────────────────────────────────────

const canEdit = computed(() =>
  ['filing', 'rejected'].includes(detail.value.filingStatus)
)
const canVoid = computed(() =>
  detail.value.filingStatus === 'filing'
)

// ─── 表格列 ───────────────────────────────────────────────────────────────────

const activeTab = ref('start')

// ── 合同付款比例（非标详情只读展示）──────────────────────────
const DETAIL_PAYMENT_NODES = ['开工', '并网', '竣工验收', '质保金']
const detailPaymentContracts = computed(() => {
  const c = detail.value.commercial
  const base = [
    { type: '小E施工承包合同（常规EMC）', contractNo: c.smallEContract.contractNo, amount: c.smallEContract.amount, partyA: c.smallEContract.partyA, partyB: c.smallEContract.partyB, settlementType: '施工方',
      nodes: [{ node: '开工', ratio: 30 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 30 }, { node: '质保金', ratio: 10 }] },
    { type: '设计合同', contractNo: c.designContract.contractNo, amount: c.designContract.amount, partyA: c.designContract.partyA, partyB: c.designContract.partyB, settlementType: '设计院',
      nodes: [{ node: '开工', ratio: 50 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 20 }, { node: '质保金', ratio: 0 }] },
    ...(c.otherContracts ?? []).map((oc: any, i: number) => ({
      type: `其他合同${i + 1}`, contractNo: oc.contractNo, amount: oc.amount, partyA: oc.partyA, partyB: oc.partyB, settlementType: null as string | null,
      nodes: DETAIL_PAYMENT_NODES.map(n => ({ node: n, ratio: null as number | null }))
    }))
  ]
  return base
})

const sceneColumns = [
  { title: '序号',       key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '应用场景',   dataIndex: 'type',  key: 'type',  width: 140 },
  { title: '应用场景块数', dataIndex: 'blocks', key: 'blocks', width: 120 },
  { title: '倾角',       dataIndex: 'tiltAngle', key: 'tiltAngle', width: 100, customRender: ({ text }: { text: number | null }) => text != null ? text + '°' : '—' },
  { title: '特殊方案',   dataIndex: 'specialPlan', key: 'specialPlan', width: 160, customRender: ({ text }: { text: string | null }) => text || '—' },
]
const jiagongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 50, customRender: ({ index }: { index: number }) => index + 1 },
  { title: '物料编码', dataIndex: 'code',     key: 'code',  width: 110 },
  { title: '物料名称', dataIndex: 'name',     key: 'name',  ellipsis: true },
  { title: '物料组',   dataIndex: 'group',    key: 'group', width: 80 },
  { title: '单位',     dataIndex: 'unit',     key: 'unit',  width: 56 },
  { title: 'BOM类型',  key: 'bomType', width: 80, customRender: () => '电器BOM' },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]
const yigongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 50, customRender: ({ index }: { index: number }) => index + 1 },
  { title: '类型',     dataIndex: 'type',  key: 'type',  width: 72 },
  { title: '物料编号', dataIndex: 'code',  key: 'code',  width: 110 },
  { title: '物料描述', dataIndex: 'name',  key: 'name',  ellipsis: true },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',  width: 56 },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]

// ─── 操作 ─────────────────────────────────────────────────────────────────────

const handleEdit = () => {
  emit('edit', detail.value.id)
}

const handleVoid = async () => {
  try {
    await voidFiling(detail.value.id)
    message.success('已作废')
    emit('back')
  } catch {
    message.error('作废失败，请重试')
  }
}

async function voidFiling(_id: string) {}

// ─── 审核面板 ─────────────────────────────────────────────────────────────────

const reviewPanelVisible = ref(true)
const reviewCollapsed    = ref(true)
const showReviewFab   = computed(() => detail.value.filingStatus === 'pending_review' && reviewPanelVisible.value &&  reviewCollapsed.value)
const showReviewPanel = computed(() => detail.value.filingStatus === 'pending_review' && reviewPanelVisible.value && !reviewCollapsed.value)

watch(reviewCollapsed, async (collapsed) => {
  if (!collapsed) {
    await nextTick()
    if (reviewPanelEl.value) {
      const h = reviewPanelEl.value.getBoundingClientRect().height
      reviewPos.x = window.innerWidth - reviewSize.w - 32
      reviewPos.y = window.innerHeight - h - 32
    }
  }
})

const REJECT_REASONS = [
  '商务信息填写有误',
  '附件资料不完整或不清晰',
  '备案证信息与项目不符',
  '项目容量填写有误',
  '合同信息缺失或有误',
  '代理商资质不满足要求',
  '勘察数据与现场不符',
  '其他原因',
]
const reviewRejectReasons = ref<string[]>([])
const reviewComment       = ref('')
const reviewImageList     = ref<{ uid: string; name: string; url: string }[]>([])
const reviewDragOver      = ref(false)
const reviewPanelEl  = ref<HTMLElement | null>(null)
const reviewSize     = reactive({ w: 420, h: 0 })
const reviewPos      = reactive({ x: 0, y: 0 })
const reviewDragging = reactive({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const cornerResizing = reactive({ active: false, corner: '' as 'nw'|'ne'|'sw'|'se'|'', startX: 0, startY: 0, startW: 0, startH: 0, startPX: 0, startPY: 0 })


function onReviewDragStart(e: MouseEvent) {
  reviewDragging.active = true
  reviewDragging.startX = e.clientX; reviewDragging.startY = e.clientY
  reviewDragging.originX = reviewPos.x; reviewDragging.originY = reviewPos.y
  window.addEventListener('mousemove', onReviewDragMove)
  window.addEventListener('mouseup', onReviewDragEnd)
}
function onReviewDragMove(e: MouseEvent) {
  if (!reviewDragging.active) return
  reviewPos.x = reviewDragging.originX + (e.clientX - reviewDragging.startX)
  reviewPos.y = reviewDragging.originY + (e.clientY - reviewDragging.startY)
}
function onReviewDragEnd() {
  reviewDragging.active = false
  window.removeEventListener('mousemove', onReviewDragMove)
  window.removeEventListener('mouseup', onReviewDragEnd)
}
function onCornerResizeStart(e: MouseEvent, corner: 'nw'|'ne'|'sw'|'se') {
  e.preventDefault(); e.stopPropagation()
  const currentH = reviewPanelEl.value?.getBoundingClientRect().height ?? 480
  if (reviewSize.h === 0) reviewSize.h = currentH
  cornerResizing.active = true; cornerResizing.corner = corner
  cornerResizing.startX = e.clientX; cornerResizing.startY = e.clientY
  cornerResizing.startW = reviewSize.w; cornerResizing.startH = reviewSize.h
  cornerResizing.startPX = reviewPos.x; cornerResizing.startPY = reviewPos.y
  window.addEventListener('mousemove', onCornerResizeMove)
  window.addEventListener('mouseup', onCornerResizeEnd)
}
function onCornerResizeMove(e: MouseEvent) {
  if (!cornerResizing.active) return
  const dx = e.clientX - cornerResizing.startX
  const dy = e.clientY - cornerResizing.startY
  const minW = 332, minH = 380
  const c = cornerResizing.corner
  const newW = Math.max(minW, cornerResizing.startW + (c === 'ne' || c === 'se' ? dx : -dx))
  const newH = Math.max(minH, cornerResizing.startH + (c === 'sw' || c === 'se' ? dy : -dy))
  reviewSize.w = newW
  reviewSize.h = newH
  if (c === 'nw' || c === 'sw') reviewPos.x = cornerResizing.startPX + (cornerResizing.startW - newW)
  if (c === 'nw' || c === 'ne') reviewPos.y = cornerResizing.startPY + (cornerResizing.startH - newH)
}
function onCornerResizeEnd() {
  cornerResizing.active = false
  window.removeEventListener('mousemove', onCornerResizeMove)
  window.removeEventListener('mouseup', onCornerResizeEnd)
}
function onReviewDropZoneDrop(e: DragEvent) {
  e.preventDefault(); reviewDragOver.value = false
  if (e.dataTransfer?.files) addReviewFiles(Array.from(e.dataTransfer.files))
}
function addReviewFiles(files: File[]) {
  files.filter(f => f.type.startsWith('image/')).forEach(f => {
    reviewImageList.value.push({ uid: Date.now() + '-' + f.name, name: f.name, url: URL.createObjectURL(f) })
  })
}
function removeReviewImage(uid: string) {
  reviewImageList.value = reviewImageList.value.filter(img => img.uid !== uid)
}
function onReviewClickUpload() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true
  input.onchange = () => { if (input.files) addReviewFiles(Array.from(input.files)) }
  input.click()
}
function submitReview(action: 'pass' | 'reject' | 'skip') {
  if (action === 'pass')   message.success('已审核通过')
  else if (action === 'reject') message.warning('已标记审核不通过')
  else message.info('暂不审核')
  reviewPanelVisible.value = false
}
</script>

<style scoped>
/* ── 整体布局 ── */
.detail-page {
  height: calc(100vh - 81px); /* 减去 App 固定顶栏高度，detail-body.clientHeight 才与可见区一致 */
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ── 固定顶栏 ── */
.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 160px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.detail-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.detail-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.detail-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }
.detail-header-meta { display: flex; align-items: center; margin-left: 12px; gap: 0; flex-shrink: 0; }
.detail-header-meta-item { font-size: 13px; color: rgba(0,0,0,0.45); }
.detail-header-meta-divider { display: inline-block; width: 1px; height: 12px; background: rgba(0,0,0,0.15); margin: 0 8px; }

/* ── 内容区 ── */
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  overscroll-behavior: contain;
}
.detail-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.tabs-wrapper { background: #fff; border-radius: 8px; }
.detail-tabs :deep(.ant-tabs-nav) { position: sticky; top: 0; z-index: 9; background: #fff; border-radius: 8px 8px 0 0; }
/* 吸顶时 nav 撑满全宽（抵消 detail-body 两侧各 16px padding），卡片本体不变 */
.tabs-stuck .detail-tabs :deep(.ant-tabs-nav) { margin-left: -16px; margin-right: -16px; border-radius: 0; }
.detail-sidebar { width: 300px; flex-shrink: 0; align-self: flex-start; position: sticky; top: 72px; height: calc(100vh - 170px); }

/* ── 主内容卡片 ── */
.detail-card { border-radius: 8px; }
.detail-card--plain { background: #fff; padding: 20px; }
.detail-tabs :deep(.ant-tabs-content-holder) { padding: 0; }
.tab-body { padding: 20px; background: #fff; border-radius: 0 0 8px 8px; }

/* ── 信息分区 ── */
.info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f5f5f5;
}
.info-section:first-child,
.section-title + .info-section { margin-top: 0; padding-top: 0; border-top: none; }
.tab-body--design .info-section { border-top: none; padding-top: 0; margin-top: 32px; }
.tab-body--commercial .info-section { border-top: none; padding-top: 0; margin-top: 32px; }

.section-title--toggle { cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.section-title--collapsed { margin-bottom: 0 !important; }
.section-toggle-icon { font-size: 12px; color: #8c8c8c; background: #f0f0f0; padding: 7px 6px 5px; border-radius: 4px; display: inline-flex; align-items: center; transition: transform 0.2s; }
.section-toggle-icon.rotated { transform: rotate(-90deg); }
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin-bottom: 24px;
}
.info-section-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  margin: 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── 信息栅格（Figma 规范：4列，gap 20px，label上/value下） ── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.info-item--span2 { grid-column: span 2; }
.info-item--span3 { grid-column: span 3; }
.section-sub-title { font-size: 16px; font-weight: 500; color: rgba(0,0,0,0.88); margin: 20px 0; display: flex; align-items: center; gap: 8px; }
.section-sub-title::before { content: ''; width: 3px; height: 16px; background: #1677ff; border-radius: 2px; flex-shrink: 0; }
.upload-hint-icon { font-size: 13px; color: #8c8c8c; cursor: pointer; flex-shrink: 0; margin-left: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-header :deep(.ant-btn) { height: 28px; }
.info-item--span4 { grid-column: span 4; }
.info-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
  padding-bottom: 8px;
  white-space: nowrap;
}
.info-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
  word-break: break-word;
}

.contract-block-ro {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}
.contract-block-ro-header {
  background: #fafafa;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0,0,0,0.85);
  border-bottom: 1px solid #f0f0f0;
}
.contract-block-ro .info-grid { padding: 16px; }
.section-sub { font-size: 12px; color: #8c8c8c; }

/* ── 勘察照片只读 ── */
.photo-readonly-col   { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.photo-readonly-label { font-size: 14px; color: rgba(0,0,0,0.45); }
.photo-readonly-imgs  { display: flex; flex-wrap: wrap; gap: 8px; }
.empty-hint { font-size: 13px; color: #bbb; padding-top: 4px; }


/* ── 身份证预览 ── */
.id-card-img { width: 150px; height: 100px; border-radius: 7px; }
.id-card-img--front { background: #DDE8F4; }
.id-card-img--back  { background: #D6E3EF; }

/* ── 付款节点 ── */
.payment-nodes { display: flex; gap: 10px; margin-bottom: 20px; }
.payment-node-row {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 16px; background: #fafafa;
  border: 1px solid #f0f0f0; border-radius: 6px;
  flex: 1; text-align: center;
}
.payment-node-label { font-size: 13px; font-weight: 500; }
.payment-node-pct { font-size: 15px; font-weight: 600; color: #1677ff; }
.payment-node-desc { font-size: 12px; color: #8c8c8c; line-height: 1.4; }

/* ── 流转日志 ── */
.log-card { background: #fff; border-radius: 8px; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
.log-card-header { padding: 20px 20px 12px; flex-shrink: 0; border-bottom: 1px solid #f0f0f0; }
.log-card-header .section-title { margin-bottom: 0; }
.log-card-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; box-sizing: border-box; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
.log-card-body::-webkit-scrollbar { width: 4px; }
.log-card-body::-webkit-scrollbar-track { background: transparent; }
.log-card-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }

.approval-list       { display: flex; flex-direction: column; gap: 16px; }
.approval-date-group { display: flex; flex-direction: column; gap: 8px; }
.approval-date-header { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
.approval-date-icon   { font-size: 14px; color: rgba(0,0,0,.45); }
.approval-date-text   { font-size: 14px; font-weight: 500; color: rgba(0,0,0,.88); }

.approval-items { display: flex; flex-direction: column; padding-left: 4px; }
.approval-item  { display: flex; gap: 12px; align-items: flex-start; }

.approval-connector { display: flex; flex-direction: column; align-items: center; gap: 4px; align-self: stretch; flex-shrink: 0; }
.connector-line         { width: 1px; background: #e6e6eb; flex-shrink: 0; }
.connector-line--top    { height: 8px; }
.connector-line--bottom { flex: 1 0 0; min-height: 1px; }
.connector-icon         { font-size: 15px; flex-shrink: 0; }
.connector-icon--create  { color: #8c8c8c; }
.connector-icon--submit  { color: #1677ff; }
.connector-icon--reject  { color: #f5222d; }
.connector-icon--approve { color: #52c41a; }
.connector-icon--void    { color: #8c8c8c; }

.approval-card-wrap { flex: 1; padding-bottom: 12px; }
.approval-card {
  background: #fff;
  border: 1px solid #e6e6eb;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.approval-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.approval-card-title  { font-size: 14px; font-weight: 500; color: #1f1f1f; }
.approval-tag {
  font-size: 12px; font-weight: 400;
  padding: 0 8px; height: 22px; line-height: 20px;
  border-radius: 4px; border: 1px solid;
  white-space: nowrap; flex-shrink: 0;
}
.approval-tag--create  { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }
.approval-tag--submit  { background: #e8f7ff; border-color: #8bceff; color: #007bfe; }
.approval-tag--reject  { background: #ffe9e7; border-color: #ffaca7; color: #f5222d; }
.approval-tag--approve { background: #e8fbd6; border-color: #b7eb8f; color: #52c41a; }
.approval-tag--void    { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }

.approval-card-body { display: flex; flex-direction: column; gap: 4px; }
.approval-field     { display: flex; gap: 4px; align-items: baseline; font-size: 13px; line-height: 20px; }
.field-label        { color: #8c8c8c; flex-shrink: 0; }
.field-value        { color: #1f1f1f; }
.field-value--muted { color: rgba(0,0,0,.45); }
.field-value--red   { color: #f5222d; }

/* ── 审核面板 ── */
.review-fab {
  position: fixed; right: 24px; bottom: 24px; z-index: 1001;
  height: 40px; padding: 0 16px; border-radius: 20px;
  background: #007BFE; color: #fff;
  display: flex; flex-direction: row; align-items: center; gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,123,254,0.35);
  transition: box-shadow .15s, transform .15s;
}
.review-fab:hover { box-shadow: 0 6px 20px rgba(0,123,254,0.45); transform: translateY(-1px); }
.review-panel {
  position: fixed; z-index: 1000; width: 420px;
  background: #fff; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
  display: flex; flex-direction: column; overflow: hidden; user-select: none;
}
.review-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 0; cursor: grab; background: #fff;
}
.review-panel-header:active { cursor: grabbing; }
.review-panel-title { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.88); }
.review-panel-drag-icon { font-size: 16px; color: #9ca3af; cursor: grab; transform: rotate(90deg) translateX(2px); }
.review-panel-drag-icon:hover { color: #6b7280; }
.review-panel-close { font-size: 20px; color: #9ca3af; cursor: pointer; line-height: 1; padding: 0 2px; }
.review-panel-close:hover { color: #374151; }
.review-textarea-wrap {
  display: flex; flex-direction: column;
  margin: 0 20px 0; border: 1px solid #d9d9d9; border-bottom: none;
  border-radius: 8px 8px 0 0; overflow: hidden; transition: border-color .15s;
}
.review-drop-zone {
  margin: 0 20px; border: 1px solid #d9d9d9; border-top: none;
  border-radius: 0 0 8px 8px; overflow: hidden; transition: border-color .15s, box-shadow .15s;
}
.review-drop-zone::before {
  content: ''; display: block; height: 1px; background: #f0f0f0; margin: 0 12px;
}
.review-textarea-wrap.drag-over,
.review-drop-zone.drag-over {
  border-color: #3060FF; box-shadow: 0 0 0 2px rgba(48,96,255,0.12);
}
.review-drop-hint { padding: 20px; font-size: 14px; color: #a7a5b0; cursor: pointer; }
.review-image-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px; }
.review-image-item { position: relative; display: inline-block; }
.review-image-item img { width: 72px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0; display: block; }
.review-image-delete { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; font-size: 13px; line-height: 18px; text-align: center; cursor: pointer; display: none; }
.review-image-item:hover .review-image-delete { display: block; }
.review-panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 20px; }
.review-reject-reasons { padding: 20px 20px 12px; }
.review-reject-label { font-size: 14px; color: rgba(0,0,0,0.65); margin-bottom: 6px; }
.review-corner-handle {
  position: absolute; width: 16px; height: 16px; z-index: 20;
}
.review-corner-handle--nw { top: 0; left: 0; cursor: nwse-resize; }
.review-corner-handle--ne { top: 0; right: 0; cursor: nesw-resize; }
.review-corner-handle--sw { bottom: 0; left: 0; cursor: nesw-resize; }
.review-corner-handle--se { bottom: 0; right: 0; cursor: nwse-resize; }

/* ── 合同付款比例（非标详情）── */
.payment-contract-card { border: 1px solid #e8e8e8; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.payment-contract-header { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.payment-contract-type { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 10px; }
.payment-contract-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 24px; }
.payment-meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.payment-meta-label { color: #8c8c8c; }
.payment-meta-value { color: #262626; }
.payment-ratio-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.payment-ratio-table th { padding: 10px 12px; text-align: left; background: #f5f5f5; color: #595959; font-weight: 500; border-bottom: 1px solid #e8e8e8; }
.payment-ratio-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; position: relative; top: -0.5px; }
.payment-ratio-table tbody tr:last-child td { border-bottom: none; }
.payment-row-label { color: #8c8c8c; font-size: 13px; white-space: nowrap; }
.payment-amount-cell { color: #262626; font-variant-numeric: tabular-nums; }
.payment-total-cell { font-weight: 600; color: #262626; }
.copy-icon {
  margin-left: 5px;
  font-size: 12px;
  color: rgba(0,0,0,0.35);
  cursor: pointer;
  vertical-align: middle; position: relative; top: -0.5px;
}
.copy-icon:hover { color: #1677ff; }
</style>
