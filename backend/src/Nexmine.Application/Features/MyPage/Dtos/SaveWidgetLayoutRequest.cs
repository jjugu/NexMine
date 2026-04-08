namespace Nexmine.Application.Features.MyPage.Dtos;

public class SaveWidgetLayoutRequest
{
    public List<WidgetLayoutItem> Widgets { get; set; } = [];
}

public class WidgetLayoutItem
{
    public string WidgetType { get; set; } = "";
    public int Position { get; set; }
    public int Column { get; set; }
}
